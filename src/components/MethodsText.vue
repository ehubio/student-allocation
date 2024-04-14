<template>
  <div class="hero min-h-screen">
    <div class="hero-content text-center">
      <div>
        <h1 class="text-5xl font-medium leading-tight text-primary">EHU Biology Student-Supervisor Matching</h1>
        <p class="py-6">
          This site implements a version of the hospital-resident assignment algorithm from Roth 1984 for assigning
          a set of Biology students to a supervisor based on their preferences. There are some important additional
          steps and deviations from the hospital-resident algorithm.
        </p>
        <p class="py-6">
          To use this site you need two files. Firstly, a list of students and their preferences, with columns 'id',
          'programme', 'first choice', 'second choice', 'third choice', 'fourth choice' and optionally a 'rank' column.
          If the input file contains additional columns these will be ignored. Secondly, a list supervisors and the
          degree programmes they can supervise. Containing columns 'id', 'capacity', 'programme 1', 'programme 2',
          'programme 3' and 'programme 4'.
        </p>
        <p class="py-6">
          Firstly the matcher will remove any duplicate picks from the students. If they have any supervisor as
          a preference more than once then all the repeated entries will be removed. So if a student enters 3 preferences
          'A', 'B' and 'A' both 'A' entries will be removed. After this we randomise the remaining preferences. If
          we run the matching algorithm with only 2 preferences, the student will be almost guaranteed one of these
          whereas someone who entered all 4 preferences might get their 3rd or 4th. So we randomly assign any missing
          preferences as a supervisor who can supervise on this students degree programme. If a student had not set any
          preferences, we leave them for later and assign after the initial matching.
        </p>
        <p class="py-6">
          The matching algorithm from Roth 1984 requires 2 sided preferences to establish a stable matching. For us we
          only have preferences on the student side. We use the optional 'rank' column from the students as a proxy for
          this. If no rank column is available then we randomly order the students. We then use this rank order as the
          preference for all supervisors. That means the highest ranked student is more likely to receive their first
          choice. Note that this means if no 'rank' column is uploaded, the allocation will be different every time it
          is run because of the random element.
        </p>
        <p class="py-6">
          After this we run the matching algorithm. If there are any students who did not submit preferences, we now
          allocate them to the supervisor with the fewest students assigned who can supervise for their degree programme.
        </p>
        <p class="py-6">
          The matching algorithm is run entirely in your browser. No data is sent to the server, this is a completely
          static site. Non-anonymised data can be uploaded and used without worry.
        </p>
        <a class="btn btn-primary" href="/student-allocation/">
          Get Started
        </a>
      </div>
    </div>
  </div>

</template>

<script setup lang="ts">

</script>
