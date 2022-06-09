'use strict';

// prettier-ignore
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const form = document.querySelector('.form_workout');
const formAthlete = document.querySelector('.form_athlete');
const containerWorkouts = document.querySelector('.workouts');

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
  #map;
  #mapEvent;
  #workouts = [];
  #athlete;

  constructor() {
    // As a constuctor fired first, put here all the listeneres and init function
    // this.getPosition();
    form.addEventListener('submit', this._newWorkout.bind(this));
    formAthlete.addEventListener('submit', this.#createAthlete.bind(this));
    inputType.addEventListener('change', this._toggleElevationField);

    // this._createAthlete();
  }

  // Privat methods
  #getPosition() {
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
    this.#map = L.map('map').setView([latitude, longitude], 15);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    // Event listener
    this.#map.on('click', this._showForm.bind(this));
  }

  _showForm(e) {
    this.#mapEvent = e;
    form.classList.remove('hidden');
    inputDistance.focus();
  }

  _toggleElevationField() {
    [inputCadence, inputElevation].forEach(el =>
      el.closest('div').classList.toggle('form__row--hidden')
    );
  }

  _newWorkout(e) {
    e.preventDefault();

    if (
      [...form.querySelectorAll('input')]
        .filter(
          el => !el.closest('div').classList.contains('form__row--hidden')
        )
        .map(el => el.value)
        .every(el => !el)
    )
      return;

    const { lat, lng } = this.#mapEvent.latlng;

    // Creating of Popup
    const popup = L.popup({
      maxWidth: 250,
      minWidth: 100,
      autoClose: false,
      closeOnClick: false,
      className: 'running-popup',
    }).setContent('Workout');

    // Creating of Marker
    L.marker([lat, lng]).addTo(this.#map).bindPopup(popup).openPopup();

    if (inputType.value === 'cycling') {
      this.#workouts.push(
        new Cycling(
          inputDistance.value,
          inputDuration.value,
          [lat, lng],
          inputElevation.value
        )
      );
    } else {
      this.#workouts.push(
        new Running(
          inputDistance.value,
          inputDuration.value,
          [lat, lng],
          inputCadence.value
        )
      );
    }

    console.log(this.#workouts);

    // Clear input fields
    form.querySelectorAll('input').forEach(el => (el.value = ''));
  }

  #createAthlete() {
    if (![...formAthlete.querySelectorAll('input')].every(el => el.value))
      return;

    this.#athlete = new Athlete(
      inputGender.value,
      inputAge.value,
      inputWeight.value,
      inputHeight.value
    );
    console.log(this.#athlete);
    // Clear input fields
    formAthlete
      .querySelectorAll('input')
      .forEach(el => el.setAttribute('disabled', 'disabled'));

    inputGender.setAttribute('disabled', 'disabled');
    formAthlete.classList.add('form_athlete--active');

    this.getPosition();
  }

  // Public API
  getPosition() {
    this.#getPosition();
  }

  getAthlete() {
    return this.#athlete;
  }
}

class Workout {
  athlete = app.getAthlete();
  id = String(Date.now()).slice(-10);
  locale = navigator.language;
  date = new Intl.DateTimeFormat(this.locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(Date.now());

  constructor(distance, duration, coords) {
    this.distance = distance; // km
    this.duration = duration; // min
    this.coords = coords; // [lat, lng]
  }
}

class Cycling extends Workout {
  constructor(distance, duration, coords, elevationGain) {
    super(distance, duration, coords);
    this.elevationGain = elevationGain;
    this.calcSpeed();
    this.calcCalories();
  }

  calcSpeed() {
    this.speed = this.distance / (this.duration / 60);
  }

  calcCalories() {
    const age = Number(this.athlete.age);
    const weight = Number(this.athlete.weight);
    const height = Number(this.athlete.height);
    const duration = Number(this.duration);
    const BMRMen = 66.47 + 13.75 * weight + 5.003 * height - 6.755 * age;
    const BMRWomen = 655.1 + 9.563 * weight + 1.85 * height - 4.676 * age;

    if (this.athlete.gender === 'male') {
      this.calories = (BMRMen / 24 / 60) * 5.5 * duration;
    } else if (this.athlete.gender === 'female') {
      this.calories = (BMRWomen / 24 / 60) * 5.5 * duration;
    }
  }
}

class Running extends Workout {
  constructor(distance, duration, coords, cadence) {
    super(distance, duration, coords);
    this.cadence = cadence;

    this.calcPace();
  }

  calcPace() {
    this.pace = this.duration / this.distance;
  }
}

class Athlete {
  id = String(Date.now()).slice(-10);

  constructor(gender, age, weight, height) {
    this.gender = gender;
    this.age = age;
    this.weight = weight;
    this.height = height;
  }
}

const app = new App();
