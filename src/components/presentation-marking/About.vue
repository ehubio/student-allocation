<template>
    <div class="hero min-h-screen">
        <div class="hero-content text-center">
            <div>
                <h1 class="text-5xl font-medium leading-tight text-primary">EHU Biology Presentation Marker Allocation</h1>
                <p class="py-6">
                    This site implements an algorithm to group students with 2 markers for their presentation marking. The
                    allocation will try to split the students into roughly equal groups where:
                    <ul>
                        <li>A student is not marked by their supervisor</li>
                        <li>Every marking group has at least 1 academic member of staff</li>
                        <li>Academic members of staff are not marking with any of their PhD students</li>
                        <li>No more than 2 students which require support will be in the same room</li>
                    </ul>
                    Additionally it will try to:
                    <ul>
                        <li>Not put students with other students with the same supervisor</li>
                        <li>Keep groups an equal size</li>
                        <li>Have a students presentation subject be one of the expertise areas of one (or both) of the markers</li>
                    </ul>
                </p>
                <p class="py-6">
                    To use this site you need two files. Firstly, a csv of students. This must have columns 'id',
                    'supervisor', 'marker avoid', 'marker' and 'requires support'. Any additional columns will be ignored.
                    Secondly a csv of markers with columns 'id', 'expertise', 'phd students', 'academic', 'mark with', 'not mark with' and
                    'available to mark'. Again additional columns will be ignored.
                    The 'expertise', 'marker', 'marker avoid', 'phd students' and 'not mark with' columns can have multiple values
                    separated by a semicolon. So for expertises "Ecology" and "Biomed" enter "Ecology;Biomed". Note it is important that the
                    'id' column in the marker csv matches the 'supervisor' column in the students table if they are the same person. The 'phd students'
                    column should also match the 'id'. The expertises should also match between the two csvs.
                </p>
                <p class="py-6">
                    The matching algorithm is run entirely in your browser. No data is sent to the server, this is a completely
                    static site. Non-anonymised data can be uploaded and used without worry.
                </p>
                <a class="btn btn-primary" href="/student-allocation/presentation-marking">
                    Get Started
                </a>
            </div>
        </div>
    </div>

</template>

<script setup lang="ts">

</script>
