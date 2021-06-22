+++
title = "Switching from Disqus to utteranc.es for comments"

date = 2021-06-21
[taxonomies]
tags = ["Blog", "utteranc.es", "Disqus"]
+++

I've been using Disqus to enable comments on this blog, and I didn't put a lot of thought into the decision to choose Disqus (In my mind Disqus is a de-facto standard for comments). 



Although I don't use it a lot, I have 2 major issues with Disqus:

- Disqus emails often end up in spam, and I have a really hard time configuring correct email settings for Disqus
- Disqus does some [shady stuff, with regards to tracking](https://supunkavinda.blog/disqus)



A [friend's](https://parth-paradkar.github.io/) blog uses [utterance.es](https://utteranc.es/), which describes itself as a _lightweight  comments widget built on GitHub Issues_. For each post, it opens an issue in a pre-configured repository, and user comments appear as comments on the linked issue. I really like the idea, and wanted to make the switch.



Making the switch took me 5 minutes, and everything was ready to go!

## Configuring utterance.es

The first step is to install the utterance.es app on the repository you want to use. This is pretty simple, and is the same as allowing a 3rd party GitHub application. 



Next, we need to add the snippet that enables comments. This needs to be added to the `templates/page.html` file since we want comments to be enabled below each page (either a post/til). This is the snippet, for my website



```javascript
<script src="https://utteranc.es/client.js"
    repo="mukul-mehta/mukul-mehta.github.io"
    issue-term="pathname"
    label="comment"
    theme="preferred-color-scheme"
    crossorigin="anonymous"
    async>
 </script>
```



The `repo` field is set to the repository I want to configure issues on, `issue-term` dictates the title of the issue (pathname of the specific post in this case, can also be the full URL), `label` is an optional field that adds labels to comments created via utteranc.es, and `theme` can be chosen from a list on the utteranc.es website.


And done! Configuring utteranc.es was literally that easy. Would definitely recommend switching, if you use Disqus. The only issues I see are:

1. If you don't have a GitHub account, or don't want to link your GitHub account to comments you make, there's no way to comment
2. No threads: Disqus had threads, which was a logical way to structure a conversation, and GitHub issues does not support threads :(

