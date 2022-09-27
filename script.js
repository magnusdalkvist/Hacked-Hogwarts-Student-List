"use strict";

window.addEventListener("DOMContentLoaded", start);

let allStudents = [];
let expelledStudents = [];
let families;

const Student = {
  firstName: "",
  lastName: "",
  middleName: "",
  nickName: "",
  image: "",
  house: "",
  bloodStatus: "",
  prefect: false,
  inquisitorial: false,
};

const settings = {
  filter: "all",
  sortBy: "firstName",
  sortDir: "desc",
  search: "",
};

async function start() {
  console.log("ready");

  await loadFamilies();
  await loadStudents();
  registerButtons();
}

function registerButtons() {
  document.querySelector("input").addEventListener("input", searchArray);
  document.querySelectorAll("[data-action='filter']").forEach((button) => button.addEventListener("click", selectFilter));
  document.querySelectorAll("[data-action='sort']").forEach((button) => button.addEventListener("click", selectSort));
}

function searchArray(event) {
  settings.search = event.target.value;

  buildList();
}

async function loadFamilies() {
  fetch("https://petlatkea.dk/2021/hogwarts/families.json")
    .then((response) => response.json())
    .then((jsonData) => {
      // when loaded, prepare objects
      families = jsonData;
    });
}

async function loadStudents() {
  fetch("https://petlatkea.dk/2021/hogwarts/students.json")
    .then((response) => response.json())
    .then((jsonData) => {
      // when loaded, prepare objects
      prepareObjects(jsonData);
    });
}

function prepareObjects(jsonData) {
  allStudents = jsonData.map(prepareObject);

  buildList();
}

function prepareObject(jsonObject) {
  const student = Object.create(Student);

  //correct capitalization
  let upperCase = true;
  let result = "";
  for (let i = 0; i < jsonObject.fullname.length; i++) {
    let letter = jsonObject.fullname[i];
    if (upperCase) {
      letter = letter.toUpperCase();
    } else {
      letter = letter.toLowerCase();
    }
    upperCase = letter === " " || letter === "-" || letter === '"';
    result += letter;
  }

  //splits into fullname, lastname, middlename and nickname
  const fullname = result.trim().split(" ");
  if (fullname.length > 2) {
    student.firstName = fullname[0];
    if (fullname[1].includes('"')) {
      student.nickName = fullname[1];
    } else {
      student.middleName = fullname[1];
    }
    student.lastName = fullname[2];
  } else if (fullname.length < 2) {
    student.firstName = fullname[0];
    student.lastName = "";
  } else {
    student.firstName = fullname[0];
    student.lastName = fullname[1];
  }

  //adds houses
  student.house = jsonObject.house.trim().substring(0, 1).toUpperCase() + jsonObject.house.trim().substring(1).toLowerCase();

  //adds images
  if (student.lastName != undefined) {
    student.image = `images/${student.lastName.toLowerCase()}_${student.firstName.substring(0, 1).toLowerCase()}.png`;
    if (student.lastName.includes("-")) {
      student.image = `images/${student.lastName.toLowerCase().substring(student.lastName.indexOf("-") + 1)}_${student.firstName.toLowerCase().substring(0, 1)}.png`;
    }
  }

  //adds blood-status
  if (families.half.includes(student.lastName)) {
    student.bloodStatus = "half-blood";
  } else if (families.pure.includes(student.lastName)) {
    student.bloodStatus = "pure-blood";
  } else {
    student.bloodStatus = "muggle-blood";
  }

  return student;
}

function selectFilter(event) {
  const filter = event.target.dataset.filter;
  setFilter(filter);
}

function setFilter(filter) {
  settings.filter = filter;
  buildList();
}

function filterList(currentList) {
  let filteredList;

  if (settings.filter === "all") {
    filteredList = allStudents;
  } else {
    filteredList = currentList.filter(checkFilter);
  }
  return filteredList;
}

function checkFilter(student) {
  return student.house === settings.filter;
}

function selectSort(event) {
  const sortBy = event.target.dataset.sort;
  const sortDir = event.target.dataset.sortDirection;

  const oldElement = document.querySelector(`[data-sort="${settings.sortBy}"]`);
  //sorts from A-Z when pressed again later
  oldElement.dataset.sortDirection = "desc";
  oldElement.classList.remove("sortBy");
  event.target.classList.add("sortBy");

  if (sortDir === "asc") {
    event.target.dataset.sortDirection = "desc";
  } else {
    event.target.dataset.sortDirection = "asc";
  }
  setSort(sortBy, sortDir);
}

function setSort(sortBy, sortDir) {
  settings.sortBy = sortBy;
  settings.sortDir = sortDir;
  buildList();
}

function sortList(sortedList) {
  let direction = 1;
  if (settings.sortDir === "desc") {
    direction = 1;
  } else {
    direction = -1;
  }

  sortedList = sortedList.sort(sortByProperty);

  function sortByProperty(studentA, studentB) {
    if (studentA[settings.sortBy] < studentB[settings.sortBy]) {
      return -1 * direction;
    } else {
      return 1 * direction;
    }
  }

  return sortedList;
}

function buildList() {
  const currentList = filterList(allStudents);
  const sortedList = sortList(currentList);

  let searchList;
  if (settings.search !== "") {
    searchList = sortedList.filter((elm) => {
      let searchCriteria =
        elm.firstName.toUpperCase().includes(settings.search.toUpperCase()) ||
        elm.lastName.toUpperCase().includes(settings.search.toUpperCase()) ||
        elm.middleName.toUpperCase().includes(settings.search.toUpperCase()) ||
        elm.nickName.toUpperCase().includes(settings.search.toUpperCase()) ||
        elm.house.toUpperCase().includes(settings.search.toUpperCase());
      return searchCriteria;
    });
    displayList(searchList);
  } else {
    displayList(sortedList);
  }
}

function displayList(list) {
  document.querySelector("#list tbody").innerHTML = "";
  list.forEach(displayStudent);
  document.querySelector("#currentDisplay").innerHTML = `Students displayed: ${list.length}`;
  document.querySelector("#expelledStudents").innerHTML = `Students expelled: ${expelledStudents.length}`;
}

function displayStudent(student) {
  const clone = document.querySelector("template#student").content.cloneNode(true);

  clone.querySelector("[data-field=firstName]").textContent = student.firstName;
  clone.querySelector("[data-field=lastName]").textContent = student.lastName;
  clone.querySelector("[data-field=middleName]").textContent = student.middleName;
  clone.querySelector("[data-field=nickName]").textContent = student.nickName;
  clone.querySelector("[data-field=house]").textContent = student.house;
  clone.querySelector("tr").addEventListener("click", () => popup(student));
  document.querySelector("#list tbody").appendChild(clone);
}

function popup(student) {
  const popup = document.querySelector("#popup");

  document.querySelector("#close").addEventListener("click", close);

  popup.style.display = "grid";
  popup.querySelector("article").classList.add(student.house);
  popup.querySelector(".houseCrest").src = `images/${student.house.toLowerCase()}.png`;
  popup.querySelector(".studentPhoto").src = student.image;
  popup.querySelector(".fullName").textContent = `${student.firstName} ${student.middleName} ${student.nickName} ${student.lastName}`;
  popup.querySelector(".bloodStatus").textContent = `Blood-status: ${student.bloodStatus}`;
  popup.querySelector(".inquisitorial").textContent = `Inquisitorial: ${student.inquisitorial}`;
  popup.querySelector(".prefect").textContent = `Prefect: ${student.prefect}`;

  if (student.bloodStatus == "pure-blood" || student.house == "Slytherin") {
    popup.querySelector("#makeIT").addEventListener("click", clickIT);
    popup.querySelector("#makeIT").style.display = "block";
    popup.querySelector(".inquisitorial").style.display = "block";
  } else {
    popup.querySelector(".inquisitorial").style.display = "none";
    popup.querySelector("#makeIT").style.display = "none";
  }
  function clickIT() {
    if (settings.hacked) {
      student.inquisitorial = true;
      setTimeout(removeInquisitorial, 1000);

      function removeInquisitorial() {
        student.inquisitorial = false;
        popup.querySelector(".inquisitorial").textContent = `Inquisitorial: ${student.inquisitorial}`;
      }
    } else {
      if (student.inquisitorial) {
        student.inquisitorial = false;
      } else {
        student.inquisitorial = true;
      }
    }
    popup.querySelector(".inquisitorial").textContent = `Inquisitorial: ${student.inquisitorial}`;
  }

  popup.querySelector("#makePrefect").addEventListener("click", clickPrefect);
  function clickPrefect() {
    if (student.prefect === true) {
      student.prefect = false;
      console.log("false");
    } else {
      tryToMakeAPrefect(student);
      console.log("true");
    }
    popup.querySelector(".prefect").textContent = `Prefect: ${student.prefect}`;
  }

  popup.querySelector("button#expel").addEventListener("click", expelStudent);
  function expelStudent() {
    if (student.firstName != "Magnus" && student.lastName != "Dalkvist") {
      allStudents.splice(allStudents.indexOf(student), 1);
      expelledStudents.push(student);
    } else {
      alert("This student can't be expelled");
    }
    close();
  }
  function close() {
    document.querySelector("#popup").style.display = "none";
    document.querySelector("#popup article").className = "";
    popup.querySelector("#makePrefect").removeEventListener("click", clickPrefect);
    popup.querySelector("button#expel").removeEventListener("click", expelStudent);
    popup.querySelector("#makeIT").removeEventListener("click", clickIT);
    buildList();
  }
}

function tryToMakeAPrefect(selectedStudent) {
  const prefects = allStudents.filter((student) => student.prefect);
  const other = prefects.filter((student) => student.house === selectedStudent.house);

  if (other.length >= 2) {
    console.log("there can only be 2 prefect of each house");
    removeAorB(other[0], other[1]);
  } else {
    makePrefect(selectedStudent);
  }

  function removeAorB(studentA, studentB) {
    document.querySelector("#onlytwoprefects").classList.add("show");
    document.querySelector("#onlytwoprefects .closebutton").addEventListener("click", closeDialog);
    document.querySelector("#onlytwoprefects button[data-action='remove1'").addEventListener("click", clickRemoveA);
    document.querySelector("#onlytwoprefects button[data-action='remove2'").addEventListener("click", clickRemoveB);

    console.log(studentA);
    document.querySelector("#onlytwoprefects .student1").textContent = studentA.firstName;
    document.querySelector("#onlytwoprefects .student2").textContent = studentB.firstName;

    function closeDialog() {
      document.querySelector("#onlytwoprefects").classList.remove("show");
      document.querySelector("#onlytwoprefects .closebutton").removeEventListener("click", closeDialog);
      document.querySelector("#onlytwoprefects button[data-action='remove1'").removeEventListener("click", clickRemoveA);
      document.querySelector("#onlytwoprefects button[data-action='remove2'").removeEventListener("click", clickRemoveB);
      buildList();
    }

    function clickRemoveA() {
      removePrefect(studentA);
      makePrefect(selectedStudent);
      closeDialog();
    }

    function clickRemoveB() {
      removePrefect(studentB);
      makePrefect(selectedStudent);
      closeDialog();
    }
  }

  function removePrefect(student) {
    student.prefect = false;
  }

  function makePrefect(student) {
    student.prefect = true;
    document.querySelector("#popup .prefect").textContent = `Prefect: ${student.prefect}`;
  }
}

function hackTheSystem() {
  settings.hacked = true;
  if (settings.hacked) {
    //random blood-type
    let random;
    allStudents.forEach((student) => {
      random = Math.floor(Math.random() * 3);
      if (random == 0) {
        student.bloodStatus = "pure-blood";
      } else if (random == 1) {
        student.bloodStatus = "half-blood";
      } else {
        student.bloodStatus = "muggle-blood";
      }
      //remove inquisitorial
      student.inquisitorial = false;
    });
    //inject myself
    const myself = {
      firstName: "Magnus",
      lastName: "Dalkvist",
      middleName: "Büchner",
      nickName: "",
      image: "",
      house: "Ravenclaw",
      bloodStatus: "pure-blood",
      prefect: false,
      inquisitorial: true,
    };
    allStudents.push(myself);
  }
  buildList();
}
