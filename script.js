'use strict';

const form = document.querySelector('.form_workout');
const formAthlete = document.querySelector('.form_athlete');
const containerWorkouts = document.querySelector('.workouts');
const athleteEdit = document.querySelector('.athlete__edit');

const inputGender = document.querySelector('.form__input--gender');
const inputAge = document.querySelector('.form__input--age');
const inputWeight = document.querySelector('.form__input--weight');
const inputHeight = document.querySelector('.form__input--height');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

class App {
  #storage = window.localStorage;
  #map;
  #markerGroup;
  #mapEvent;
  #mapZoomLevel = 15;
  #workouts = [];
  #athlete;

  constructor() {
    if (this.#storage.length > 0) {
      console.log('local');
      this.#getLocalStorage();
    }

    formAthlete.addEventListener('submit', this._checkAthleteForm.bind(this));
    // As a constuctor fired first, put here all the listeneres and init function
    form.addEventListener('submit', this._checkWorkoutForm.bind(this));
    inputType.addEventListener('change', this._toggleElevationField);
    containerWorkouts.addEventListener(
      'click',
      e => {
        if (e.target.className === 'workout__delete') {
          this.#removeWorkout(e.target.closest('.workout'));
        } else {
          this.#moveToPopup(e);
        }
      }
      // this.#moveToPopup.bind(this)
    );
    window.addEventListener('keydown', e => {
      if (e.key === 'Escape') {
        this._hideForm();
      }
    });
  }

  // Privat methods
  _getPosition() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        // callback, calls when will be ready
        // as a regular function, so bind THIS
        this._loadMap.bind(this),
        function (error) {
          console.log(error);
        }
      );
    }
  }

  _loadMap(position) {
    const { latitude, longitude } = position.coords;

    // L - global namespace Leaflet
    // map
    this.#map = L.map('map').setView([latitude, longitude], this.#mapZoomLevel);
    this.#markerGroup = L.layerGroup().addTo(this.#map);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    // Event listener
    this.#map.on('click', this._showForm.bind(this));

    // Render workouts and markers
    this.#workouts.forEach(el => {
      this.#renderWorkout(el);
      this.#renderWorkoutMarker(el);
    });
  }

  _showForm(e) {
    this.#mapEvent = e;
    form.classList.remove('hidden');
    inputDistance.focus();
  }

  _hideForm() {
    // Clear input fields
    form.querySelectorAll('input').forEach(el => (el.value = ''));
    form.classList.add('hidden');
  }

  _toggleElevationField() {
    [inputCadence, inputElevation].forEach(el =>
      el.closest('div').classList.toggle('form__row--hidden')
    );
  }

  _checkWorkoutForm(e) {
    e.preventDefault();
    const formFieldsValues = [...form.querySelectorAll('input')]
      .filter(el => !el.closest('div').classList.contains('form__row--hidden'))
      .map(el => el.value);

    if (!formFieldsValues.every(el => el && isFinite(el) && el > 0)) return;

    this._newWorkout();
  }

  _checkAthleteForm(e) {
    e.preventDefault();
    console.log('click');
    if (
      ![...formAthlete.querySelectorAll('input')].every(
        el => el.value && isFinite(el.value) && el.value > 0
      )
    )
      return;

    this.#createAthlete();
  }

  _editAthlete(e) {
    e.preventDefault();
    // this.#enableAthletFields();
    formAthlete
      .querySelectorAll('input')
      .forEach(el => el.removeAttribute('disabled'));

    inputGender.removeAttribute('disabled');
    formAthlete.classList.add('form_athlete--active');
  }

  _newWorkout() {
    const { lat, lng } = this.#mapEvent.latlng;
    let workout;

    if (inputType.value === 'cycling') {
      workout = new Cycling(
        inputDistance.value,
        inputDuration.value,
        [lat, lng],
        inputElevation.value
      );
    }
    if (inputType.value === 'running') {
      workout = new Running(
        inputDistance.value,
        inputDuration.value,
        [lat, lng],
        inputCadence.value
      );
    }

    workout
      .getWeather(lat, lng)
      .then(weatherData => {
        let date = new Date().toISOString();
        date = date.slice(0, date.indexOf(':')) + ':00';

        const {
          time,
          relativehumidity_2m: humidity,
          temperature_2m: temperature,
          windspeed_10m: windspeed,
        } = weatherData.hourly;

        const weatherArrayIndex = time.findIndex(el => el === date);

        workout.weather = {
          time: time[weatherArrayIndex],
          humidity: humidity[weatherArrayIndex],
          temperature: temperature[weatherArrayIndex],
          windspeed: windspeed[weatherArrayIndex],
        };
      })
      .catch(err => console.log(err))
      .finally(() => {
        this.#workouts.push(workout);
        this.#storage.setItem('workouts', JSON.stringify(this.#workouts));
        this.#renderWorkoutMarker(workout);
        this.#renderWorkout(workout);
        this._hideForm();
      });
  }

  #removeWorkout(workout) {
    const id = workout.dataset.id;
    const idx = this.#workouts.findIndex(el => el.id === id);
    const marker = this.#workouts[idx].marker;

    this.#workouts.splice(idx, 1);
    this.#storage.setItem('workouts', JSON.stringify(this.#workouts));

    containerWorkouts.innerHTML = '';

    this.#markerGroup.removeLayer(marker);

    this.#workouts.forEach(el => {
      this.#renderWorkout(el);
    });
  }

  #renderWorkout(workout) {
    const li = document.createElement('li');

    li.classList.add(`workout`, `workout--${workout.name}`);
    li.dataset.id = workout.id;
    li.innerHTML = `
      <h2 class="workout__title">${
        workout.name[0].toUpperCase() + workout.name.slice(1)
      } on ${workout.date} </h2>
      <div class="workout__delete--container"><span class="workout__delete">❌</span></div>
      <div class="workout__details">
        <span class="workout__icon">🚴‍♀️</span>
        <span class="workout__value">${workout.distance}</span>
        <span class="workout__unit">km</span>
      </div>
      <div class="workout__details">
        <span class="workout__icon">⏱</span>
        <span class="workout__value">${workout.duration}</span>
        <span class="workout__unit">min</span>
      </div>
      <div class="workout__details">
        <span class="workout__icon">⚡️</span>
        <span class="workout__value">${
          workout.name === 'cycling' ? workout.speed : workout.pace
        }</span>
        <span class="workout__unit">${
          workout.name === 'cycling' ? 'km/h' : 'min/km'
        }</span>
      </div>
      <div class="workout__details">
        <span class="workout__icon">${
          workout.name === 'cycling' ? '⛰' : '🦶🏼'
        }</span>
        <span class="workout__value">${
          workout.name === 'cycling' ? workout.elevationGain : workout.cadence
        }</span>
        <span class="workout__unit">${
          workout.name === 'cycling' ? 'm' : 'spm'
        }</span>
      </div>
      <div class="workout__details workout__calories">
        <span class="workout__value">Calories burned:&nbsp;</span>
        <span class="workout__value">${
          workout.name === 'cycling' ? workout.calories : workout.cadence // TODO
        }</span>
      
      </div>
    `;
    containerWorkouts.insertAdjacentElement('afterbegin', li);
  }

  #renderWorkoutMarker(workout) {
    // Creating of Popup
    const div = document.createElement('div');

    const temperature = workout.weather?.temperature ?? 0;
    const humidity = workout.weather?.humidity ?? 0;
    const windspeed = workout.weather?.windspeed ?? 0;

    div.innerHTML = `
      <div>
      ${
        workout.name === 'cycling'
          ? '🚴‍♀️ Cycling on ' + workout.date
          : '🏃‍♂️ Running on ' + workout.date
      }
      </div>
      <div class="additional__info"><span>🌡 ${temperature} °C</span><span>💧 ${humidity} %</span><span>💨 ${windspeed} km/h</span></div>
      `;

    const popup = L.popup({
      maxWidth: 250,
      minWidth: 200,
      autoClose: false,
      closeOnClick: false,
      className: `${
        workout.name === 'cycling' ? 'cycling-popup' : 'running-popup'
      }`,
    }).setContent(div);

    // Creating of Marker
    const marker = L.marker(workout.coords);

    marker.addTo(this.#markerGroup).bindPopup(popup).openPopup();
    workout.marker = marker._leaflet_id;
  }

  #moveToPopup(e) {
    const target = e.target.closest('.workout');
    if (target) {
      const id = target.dataset.id;
      const position = this.#workouts.find(el => el.id === id);

      this.#map.setView(position.coords, this.#mapZoomLevel, {
        animate: true,
        duration: 0.7,
      });
    }
  }

  #createAthlete() {
    this.#athlete = {
      id: String(Date.now()).slice(-10),
      gender: inputGender.value,
      age: inputAge.value,
      weight: inputWeight.value,
      height: inputHeight.value,
    };

    this.#disableAthletFields();
    this.#enableAthleteEdit();
    this.#storage.setItem('athlete', JSON.stringify(this.#athlete));

    if (this.#map) return;

    this._getPosition();
  }

  #disableAthletFields() {
    formAthlete
      .querySelectorAll('input')
      .forEach(el => el.setAttribute('disabled', 'disabled'));

    inputGender.setAttribute('disabled', 'disabled');
    formAthlete.classList.add('form_athlete--active');
  }

  #enableAthleteEdit() {
    athleteEdit.classList.remove('athlete__edit--hidden');
    athleteEdit.addEventListener('click', this._editAthlete.bind(this));
  }

  #getLocalStorage() {
    this.#athlete = JSON.parse(this.#storage.getItem('athlete'));
    this.#workouts =
      JSON.parse(this.#storage.getItem('workouts')) || this.#workouts;

    inputGender.value = this.#athlete.gender;
    inputAge.value = this.#athlete.age;
    inputWeight.value = this.#athlete.weight;
    inputHeight.value = this.#athlete.height;

    this.#disableAthletFields();
    this.#enableAthleteEdit();
    this._getPosition();
  }

  // Public API
  getAthlete() {
    return this.#athlete;
  }
}

class Workout {
  athlete = app.getAthlete();
  id = String(Date.now()).slice(-10);
  date = new Intl.DateTimeFormat('en-us', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(Date.now());

  constructor(distance, duration, coords) {
    this.distance = distance; // km
    this.duration = duration; // min
    this.coords = coords; // [lat, lng]
  }

  getWeather(lat, lng) {
    return new Promise(function (resolve) {
      fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&hourly=temperature_2m,relativehumidity_2m,windspeed_10m`
      )
        .then(response => {
          // console.log(response);
          return response.json();
        })
        .then(resolve);
    });
  }
}

class Cycling extends Workout {
  name = 'cycling';
  constructor(distance, duration, coords, elevationGain) {
    super(distance, duration, coords);
    this.elevationGain = elevationGain;
    this.calcSpeed();
    this.calcCalories();
  }

  calcSpeed() {
    this.speed = (this.distance / (this.duration / 60)).toFixed(1);
  }

  calcCalories() {
    const age = Number(this.athlete.age);
    const weight = Number(this.athlete.weight);
    const height = Number(this.athlete.height);
    const duration = Number(this.duration);
    const BMRMen = 66.47 + 13.75 * weight + 5.003 * height - 6.755 * age;
    const BMRWomen = 655.1 + 9.563 * weight + 1.85 * height - 4.676 * age;

    if (this.athlete.gender === 'male') {
      this.calories = Math.trunc((BMRMen / 24 / 60) * 5.5 * duration);
    } else if (this.athlete.gender === 'female') {
      this.calories = Math.trunc((BMRWomen / 24 / 60) * 5.5 * duration);
    }
  }
}

class Running extends Workout {
  name = 'running';
  constructor(distance, duration, coords, cadence) {
    super(distance, duration, coords);
    this.cadence = cadence;
    this.calcPace();
  }

  calcPace() {
    this.pace = (this.duration / this.distance).toFixed(1);
  }
}

const app = new App();

// TODO

// prettier-ignore
// 0. Edit an athlete
// Add 'Edit' label on the top of athlet section
// Add EventListener
// When click - remove 'disable' attribute from inputs
// When click 'ENTER' - overwrite Athlet object
// Add 'disabled' attribute to inputs

// prettier-ignore
// 1. Edit workout
// Display edit button on workout when it hovered (slide from left side)

// prettier-ignore
// 2. Delete workout
// Display delete button on workout when it hovered (slide from left side)
// When click - display confirmation window - 'Are you sure?'
// If Yes
// Remove workout from sidebar
// Remove marker from map
// Remove workout from array
// If No
// Close popup window

// prettier-ignore
// 3. Remove all workouts
// Add remove button
// When click - add confirmation popup window - 'Are you sure?'

// prettier-ignore
// 4. Sort workouts by certain field (duration)
// 5. Re-build Running and Cycling objects coming from local storage
// 6. More realistic error and confirmation messages
// 7. Position the map to show ALL workouts -- Leaflet API
// 8. Draw line and chapes instead of points -- Leaflet API
// 8. Geocode location from coordinates -- asynchronous

// prettier-ignore
// 9. Display weather for workouts  place and time -- asynchronous
