+++
title = "Linux's Out-Of-Memory Killer"
date = 2021-01-08
[taxonomies]
tags = ["til", "linux"]
+++

# Linux's OOM Killer

On Linux, processes can request more memory than that is currently free in the system. This is to manage memory more efficiently since processes might not use all of their allocated memory immediately and without this overcommiting, memory will be wasted. But this comes with an issue, what if a processes hogs so much memory such that even a single new page can't be allocated to another process. This is where the OOM-Killer kicks in. The OOM-Killer (The name's pretty cool ain't it?) kicks in and sacrifices one or more processes

I was curious as to how the OOM-Killer knows which process to kill. It needs to make sure the least disruption is caused but free enough space for other processes. Turns out the kernel creates a score called the `oom_score` to decide which process to kill

## When is the OOM Killer called?

For any process to get memory, the kernel must allocate pages and then mark those pages for the created process. This is written in the file [mm/page_alloc.c](https://github.com/torvalds/linux/blob/master/mm/page_alloc.c). When checking for free pages, it does a check to see if it is out of memory ([here](https://github.com/torvalds/linux/blob/71c061d2443814de15e177489d5cc00a4a253ef3/mm/page_alloc.c#L4107)). If the check fails, it does some sanity checking and then falls back to the OOM Killer. Given below is roughly the call stack:

```c
_alloc_pages -> out_of_memory() -> select_bad_process() -> badness()
```

The code for the OOM Killer lies in [mm/oom_kill.c](https://github.com/torvalds/linux/blob/master/mm/oom_kill.c)

## Deciding which process to kill

The OOM Killer calculates a score called [badness](https://github.com/torvalds/linux/blob/71c061d2443814de15e177489d5cc00a4a253ef3/mm/oom_kill.c#L194). The comments for the function explain what it does:

```markdown
/\*\*

- oom_badness - heuristic function to determine which candidate task to kill
- @p: task struct of which task we should calculate
- @totalpages: total present RAM allowed for page allocation
-
- The heuristic for determining which task to kill is made to be as simple and
- predictable as possible. The goal is to return the highest value for the
- task consuming the most memory to avoid subsequent oom failures.
  \*/
```

```c
long oom_badness(struct task_struct *p, unsigned long totalpages)
```

When calculating the score:

1. Total memory consumed by a process (Including all its threads) is calculated
2. For processes that have been running for a long time, the badness score is decreased
3. For process whose priority has been changed with `nice`, the badness is doubled since they are likely less important

Hence the processes that are likely to be killed are: Newly started, non-root and consuming a lot of memory

For each process, a special file is created in the procfs: `/proc/$PID/oom_score`. This contains the score calculated by the above method. A higher score (badness) means that the process is likely to be killed. To adjust the score for special processes, another file is present: `/proc/$PID/oom_adj`. This contains the adjustment factor. The adj factor ranges from -16 to 15. A value of -17 ( `OOM_DISABLE` is a macro set to this value) means the process can't be OOM Killed. The lower the value, the lower the chance of the process being killed.

## Can I check the OOM Score for a process?

Yes! For a process with given PID, `/proc/PID/oom_score` gives the score. The adj is given in `/proc/PID/oom_adj` and the adjusted score is present in `/proc/PID/oom_adj_score`

I plan on running a small script to see how this number changes as a process consumes more and more memory. I tried with a simple C script:

```c
#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>

int main() {
  int pid = getpid(), size = 1000;
 	long int total = 0;
  while(1) {
    int *temp = (int *)malloc(size * sizeof(int));
    total += size;
    printf("PID: %d has malloced %ld memory\n", pid, total);
  	usleep(750);
  }
}
```

The `oom_score` starts at 0 and increases till 300 before the OOM Killer decides to kill the process

I'd love to hear comments and mistakes I made below, drop a comment!

### Sources:

1. [https://linux-mm.org/OOM_Killer](https://linux-mm.org/OOM_Killer) - Great article. The website contains a lot of info about linux memory management
2. [This StackOverflow answer](https://unix.stackexchange.com/questions/153585/how-does-the-oom-killer-decide-which-process-to-kill-first)
3. [This LWN article](https://lwn.net/Articles/317814/)
