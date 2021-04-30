+++
title = "Reducing Docker container sizes for Python apps"

date = 2021-04-29
[taxonomies]
tags = ["Docker", "Python"]
+++



Over the past couple days, I was working on AWS infra for LTTKGP (I've written a [blog](https://metamehta.in/posts/aws-experiments/) about it). One of the major services, C-3PO is built with Flask-REST, and we use Docker to deploy it (Using AWS ECS).

The image that we use takes some time to build and push to AWS ECR. I had to do this a couple of times and it was quite frustrating to wait. I googled a couple ways to reduce the size of the container and tried some of them

To begin with, here's our original image. It's based on Python 3.7, and we cache dependencies when installing with `pip`. The container is 1.03 GB in size, and takes around 195 seconds to build, on my laptop.

![Current image that we use](vanilla.jpg)

## Attempt #1: Disable pip's dependency caching

Using the `--no-cache-dir` flag, we can disable caching dependencies installed via pip. This should reduce the size by a couple MBs atleast. Since the cache is useless inside the container, this has no unintended side-effects.

![Vanilla image with cache disabled](vanilla-no-cache.jpg)

The size reduced by 38 MB or so, yaaay I guess

## Attempt #2: Using python-slim as base image

Right now, we're using `python:3.7` as our base image. This image is based on Debian Buster (Debian 10), and comes with a ton of packages, most of which we do not need. We could use `python:3.7-slim` as our base image, it contains only the packages needed to run python (it's still based on Debian)

There's 2 caveats though:

1. We use uWSGI, which needs GCC and glibc during installation, and we need to install those via `apt`
2. To install the `psycopg2` package, we need `pg_config`. To avoid installing it from source, we install the `'psycopg2-binary` package instead

```dockerfile
FROM python:3.7-slim
RUN apt-get update \
    && apt-get install gcc -y \
    && apt-get clean
```

![Using Python Slim as base image](slim.jpg)

Damn, we're down to 343MB. It took around 100 seconds to build, which is half the time to build the original image. Since we haven't made any changes to our python app as such, I expect it to run properly. I tried hitting a couple endpoints manually (obviously a pretty crude way of testing) and it works alright!

#### Using Alpine as base

We could use `python:3.7-alpine` as a base image for our container. Alpine is a lightweight distro, that is very popular with containers. It ships with musl and busybox, instead of glibc and GNU coreutils. I did read on a couple places though that unless space is a major constraint, it's not a great idea to use alpine as a base image for python apps, since all wheels don't build, and there are issues with debugging

Also, uWSGI needs glibc to install by default. There are ways to install it using musl but I'll need to try those. There's also other issues, `psycopg2` needs to be built from source etc

For now, I'm not trying the alpine base image

## Attempt #3: Multistage builds

Docker has this cool idea of multistage builds, where you can install all of your dependencies in one image, and copy just the installed dependencies over to a new image. We use this second image as our final image, in which our app runs. 



To create a multistage build, in our first image, we install all dependencies in a virtualenv (since it'll help keep everything in one folder). Then, we copy over this created venv to our final image, and add it to PATH. Our final image now just the venv folder, and no extra dependencies (such as `gcc` that we had installed in our first image)

Here's the Dockerfile for reference

```dockerfile
# Base Python image for container
FROM python:3.7-slim AS builder
RUN apt-get update \
    && apt-get install gcc -y \
    && apt-get clean

RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

COPY requirements/common.txt requirements.txt
RUN pip install --upgrade pip && pip install --no-cache-dir -r requirements.txt


FROM python:3.7-slim

# Set unbuffered output to make sure all logs are printed and not stuck in buffer
ENV PYTHONUNBUFFERED 1

RUN mkdir -p /c3po
COPY --from=builder /opt/venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

ADD . /c3po/
WORKDIR /c3po
RUN pip install -e .

ENV PYTHONPATH=/c3po

COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh
EXPOSE 8000
ENTRYPOINT ["/entrypoint.sh"]

```


Let's see how this build goes, :crossed_fingers:

![Multistage Build](multistage.jpg)

Daaaaamn! We're down to 196 MB, which is a fifth of our original 1.03 GB image. Hitting a couple of endpoints, and messing around with settings, and everything seems to work pretty well (which makes sense, since nothing really changed with our app)



I don't think there's anything further I'm going to be trying ATM. Using python slim as a base, and switching to multistage builds is magical and I'm pretty satisfied with our final image being just 20% the size of our original image, with a 50% reduction in build time!

Do let me know of other things I could try. I'd love to try those out!



## References

- [https://pythonspeed.com/articles/alpine-docker-python/](https://pythonspeed.com/articles/alpine-docker-python/)
- [https://medium.com/swlh/alpine-slim-stretch-buster-jessie-bullseye-bookworm-what-are-the-differences-in-docker-62171ed4531d](https://medium.com/swlh/alpine-slim-stretch-buster-jessie-bullseye-bookworm-what-are-the-differences-in-docker-62171ed4531d)
- [https://blog.realkinetic.com/building-minimal-docker-containers-for-python-applications-37d0272c52f3](https://blog.realkinetic.com/building-minimal-docker-containers-for-python-applications-37d0272c52f3)
- [https://docs.docker.com/develop/develop-images/multistage-build/](https://docs.docker.com/develop/develop-images/multistage-build/)

