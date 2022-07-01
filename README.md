![logo](https://user-images.githubusercontent.com/32822656/176854216-9fc469ad-5136-4543-9562-e69332ea9f0a.png)
## wOutMap - all your workouts on the map

Non commercial web application based on Leaflet library, which allows users to place their workouts on the map.  Project includes such features as Geolocation API, Local Storage API, Weather Forecast API. Also newest JavaScript features such as Classes, Private Fields etc.
Now project still is in stage of developing.


### Technologies
- JavaScript
- HTML
- CSS

### What the app can
- Display your workouts on the map and store it in Local Storage (wil be moved to database in future)
- Calculate the average speed for cycling and step per minute for running
- Calculate calories have burned during workout
- Display and store weather forecast for workouts

### How to use
**Important:** To use the wOutmap application you must to allow the Geolocotion service for the app page
- Enter the athlete data - gender, age, weight and height (for calories burning calculator)
- Choose the point on the map by clicking on it
- In the left side (workouts container) the form will be open
- Choose the type of workout (cycling or running) and fill out fields

### What will be improved and added
- [x] Remove workout
- [x] More realistic messages
- [ ] Edit workout
- [ ] Remove all workouts
- [ ] Sort workouts by certain field 
- [ ] Re-build Running and Cycling objects coming from local storage
- [ ] Strava API to map workout routes

### Demo
[wOutmap](https://woutmap.netlify.app/)

