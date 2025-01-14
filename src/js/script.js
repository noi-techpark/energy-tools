// SPDX-FileCopyrightText: 2024 NOI Techpark <digital@noi.bz.it>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

document.addEventListener("DOMContentLoaded", function () {
  const isActionsPage = window.location.pathname.includes("actions.html");
  const isIndexPage = !isActionsPage;

  function saveSelectedDate(date) {
    sessionStorage.setItem("selectedDate", date.toISOString());
  }

  function loadSelectedDate() {
    const savedDate = sessionStorage.getItem("selectedDate");
    return savedDate ? new Date(savedDate) : new Date();
  }

  let selectedDate = loadSelectedDate();
  document.getElementById("current-date").textContent =
    selectedDate.toDateString();

  const startDate = getDateFormatted(selectedDate, 8, 0, 0);
  const endDate = getDateFormatted(selectedDate, 20, 0, 0);

  //#region UTILITY FUNCTIONS
  // add some custom logic to handle the cases where "Semina Area is booked" - "problem that arose with sfscon"
  function mapStatus(string) {
    const roomList = [
      "Seminar 1",
      "Seminar 2",
      "Seminar 3",
      "Seminar 4",
      "Seminar Area",
      "Foyer",
      "Crane Hall",
    ];
    for (let i = 0; i < roomList.length; i++) {
      let roomRegex = new RegExp(".*" + roomList[i] + ".*", "i");
      if (roomRegex.test(string)) {
        return { found: true, room: roomList[i] };
      }
    }
    return { found: false, room: "NO MATCH" };
  }

  function getDateFormatted(
    selectedDate = new Date(),
    hours = 8,
    minutes = 0,
    seconds = 0
  ) {
    const now = new Date(selectedDate);
    now.setHours(hours, minutes, seconds, 0); 

    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const formattedHours = String(now.getHours()).padStart(2, "0");
    const formattedMinutes = String(now.getMinutes()).padStart(2, "0");
    const formattedSeconds = String(now.getSeconds()).padStart(2, "0");

    return `${year}-${month}-${day}T${formattedHours}:${formattedMinutes}:${formattedSeconds}`;
  }

  function getCorrectHour(time, type) {
    let hour = time.getHours();
    const minutes = time.getMinutes();
    let flag = "sharp";

    if (minutes >= 15 && minutes < 45) {
      flag = "half";
    } else if (minutes >= 45) {
      hour += 1;
    }

    const adjustedHour = hour === 0 ? 24 : hour;

    // console.log(
    //   `Time: ${time}, Hour: ${adjustedHour}, Minutes: ${minutes}, Flag: ${flag}`
    // ); // OLD LOGGING
    return [adjustedHour, flag];
  }
  //#endregion

  //#region INDEX PAGE ONLY
  if (isIndexPage) {
    const tableBody = document.querySelector("#calendar-table tbody");

    document.getElementById("prevDay").addEventListener("click", () => {
      selectedDate.setDate(selectedDate.getDate() - 1);
      saveSelectedDate(selectedDate);
      updateCalendar();
    });

    document.getElementById("nextDay").addEventListener("click", () => {
      selectedDate.setDate(selectedDate.getDate() + 1);
      saveSelectedDate(selectedDate);
      updateCalendar();
    });

    function updateCalendar() {
      document.getElementById("current-date").textContent =
        selectedDate.toDateString();

      clearEvents();
      // Fetch and display events for the selected date
      const startDate = getDateFormatted(selectedDate, 8, 0, 0);
      const endDate = getDateFormatted(selectedDate, 20, 0, 0);
      getData(startDate, endDate)
        .then((data) => {
          elaborateData(data, selectedDate);
          if (isActionsPage) {
            generateActionCards();
          }
        })
        .catch((error) => {
          console.error("error processing data: ", error);
        });
    }

    function clearEvents() {
      const cells = document.querySelectorAll(".schedule-cell");
      cells.forEach((cell) => {
        cell.className = "schedule-cell";
        cell.innerHTML = "";
      });
    }

    for (let hour = 4; hour <= 24; hour++) {
      const row = document.createElement("tr");
      const timeCell = document.createElement("td");
      timeCell.classList.add("time-slot");
      timeCell.textContent = `${hour}:00`;
      row.appendChild(timeCell);

      for (let i = 0; i < 6; i++) {
        const cell = document.createElement("td");
        cell.classList.add("schedule-cell");
        row.appendChild(cell);
      }
      tableBody.appendChild(row);
    }

    function addEvent(room, startTime, endTime, eventName) {
      const [startHour, startFlag] = getCorrectHour(startTime, "start");
      const [endHour, endFlag] = getCorrectHour(endTime);

      // console.log(`LOGGING EVENT'S SCHEDULES:`, startHour, endHour);

      let duration = endHour - startHour;
      if (endFlag === "half") {
        duration = duration + 1; //Adjusts the duration for events that end at '30
      }

      const roomIndex = [
        "Seminar 1",
        "Seminar 2",
        "Seminar 3",
        "Seminar 4",
        "Foyer",
        "Crane Hall",
      ].indexOf(room);

      const rowIndex = startHour - 4;

      const heating = document.querySelector(
        `#calendar-table tbody tr:nth-child(${rowIndex}) td:nth-child(${
          roomIndex + 2
        })`
      );
      heating.classList.add("event-cell");

      for (let i = 0; i < duration; i++) {
        const cell = document.querySelector(
          `#calendar-table tbody tr:nth-child(${
            rowIndex + 1 + i
          }) td:nth-child(${roomIndex + 2})`
        );

        if (cell) {
          cell.classList.add("event-cell");

          if (i === 0) {
            cell.innerHTML = `<div class=${
              startFlag === "half" ? "event-start-30" : "event-start-0"
            } title="wtf!">${eventName}</div>`;
            cell.innerHTML += `<div class=${
              startFlag === "half" ? "heating" : "heating"
            }></div>`;
            heating.innerHTML = `<div class=${
              startFlag === "half" ? "heating-start-30" : "heating"
            }>HEAT</div>`;
          } else if (i === duration - 1) {
            cell.innerHTML = `<div class=${
              endFlag === "half" ? "event-end-30" : "event-end-0"
            }></div>`;
            cell.innerHTML += `<div class=${
              endFlag === "half" ? "heating-end-30" : "heating"
            }></div>`;
          } else {
            cell.innerHTML = `<div class="event-start-0"></div>`;
            cell.innerHTML += `<div class="heating"></div>`;
          }
        } else {
          console.error(
            `Cell not found for room: ${room}, row: ${
              rowIndex + 1 + i
            }, column: ${roomIndex + 2}`
          );
        }
      }
    }
  }
  // end of the index.html only part
  //#region

  async function getData(startDate, endDate) {
    const baseUrl = "https://tourism.api.opendatahub.com/v1/EventShort";

    const params = new URLSearchParams({
      pagenumber: "1",
      startdate: startDate,
      enddate: endDate,
      eventlocation: "NOI",
      active: "true",
      sortorder: "ASC",
      optimizedates: "true",
      removenullvalues: "true",
    });

    const url = `${baseUrl}?${params.toString()}`;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Response status: ${response.status}`);
      }

      const json = await response.json();
      console.log(json.Items);
      return json;
    } catch (error) {
      console.error(error.message);
    }
  }

  let globalEvents = [];

  function elaborateData(data, selectedDate) {
    const currentDate = new Date(selectedDate);
    console.log(`CURRENT DATE`, currentDate.toDateString());
    for (let i = 0; i < Object.keys(data.Items).length; i++) {
      let roomList = data.Items[i].RoomBooked;
      for (let j = 0; j < Object.keys(roomList).length; j++) {
        let roomBooked = data.Items[i].RoomBooked[j];
        let { found, room } = mapStatus(roomBooked["SpaceDesc"]);
        
        if (found) {
          let startTime = new Date(roomBooked["StartDate"]);
          let endTime = new Date(roomBooked["EndDate"]);
          let eventName = data.Items[i]["EventDescriptionEN"];//could be also EventDescription(DE|EN|IT|'')

          if (startTime.toDateString() === currentDate.toDateString()) {
            console.log(`EVENT ON CURRENT DATE`);
            console.log(`EVENT NAME: `,eventName);
            console.log(`EVENT ROOM: `,room);
            console.log(`START TIME: day: ${startTime.toDateString()} hour: ${startTime.getHours()}`);
            console.log(`END TIME: day: ${endTime.toDateString()} hour: ${endTime.getHours()}`);    
            if (isIndexPage) {
              if (room === "Seminar Area") {
                for (let i = 1; i < 5; i++) {
                  room = `Seminar ${i}`;
                  addEvent(room, startTime, endTime, eventName);
                }
              } else {
                addEvent(room, startTime, endTime, eventName); //addEvent can be called only from the context of the IndexPage
              }
            }

            let heatingTime = new Date(startTime.getTime());
            heatingTime.setHours(startTime.getHours() - 1);

            globalEvents.push({
              room: room,
              startTime: startTime,
              heatingTime: heatingTime,
              endTime: endTime,
              eventName: eventName,
            });
          } else {
            console.log(`SKIPPING EVENT SINCE DIFFERENT DATE: `);
            console.log(`EVENT NAME: `,eventName);
            console.log(`EVENT ROOM: `,room);
            console.log(`START TIME: day: ${startTime.toDateString()} hour: ${startTime.getHours()}`);
            console.log(`END TIME: day: ${endTime.toDateString()} hour: ${endTime.getHours()}`);            
          }
        }
      }
    }
  }

  //#region ACTIONS CARDS
  function generateActionCards() {
    const actionsContainer = document.querySelector(".actions-container");
    console.log("Actions container:", actionsContainer);
    console.log("Global events:", globalEvents.length);

    if (!actionsContainer) {
      console.log("Actions container not found!");
      return;
    }

    actionsContainer.innerHTML = "";

    globalEvents.forEach((event) => {
      console.log("Creating card for event:", event); // Debug log
      const actionCard = createActionCard(event);
      actionsContainer.appendChild(actionCard);
    });
  }

  function createActionCard(event) {
    const card = document.createElement("div");
    card.className = "action-card";

    const startTime = event.startTime.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
    const actions = generateActionsForEvent(event);

    // I need to perform a check to avoid inserting the same room multiple times
    // so the following html must probably be anticipated by an if statement to check whether
    // the event.room is already present
    card.innerHTML = `
      <h2>${event.room}</h2>
      <div class="action-time">${startTime} - ${event.eventName}</div>
      <ul class="action-list">
          ${actions
            .map(
              (action) => `
              <li class="action-item">${action}</li>
          `
            )
            .join("")}
      </ul>
  `;

    return card;
  }

  function generateActionsForEvent(event) {
    const heatingTime = event.heatingTime.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
    const actions = [];

    // Basic setup actions for all rooms
    //actions.push(`Verify room is clean and ready`);

    // Room-specific actions
    if (event.room.includes("Seminar")) {
      actions.push(`${heatingTime}: Turn on Heating`);
      actions.push(`Set up chairs and tables`);
      actions.push(`Check projector and screen`);
      actions.push(`Ensure proper lighting`);
    } else if (event.room === "Foyer") {
      actions.push(`${heatingTime}: Turn on Heating`);
      actions.push(`Arrange reception area`);
      actions.push(`Set up refreshment station`);
      actions.push(`Check lighting and ventilation`);
    } else if (event.room === "Crane Hall") {
      actions.push(`${heatingTime}: Turn on Heating`);
      actions.push(`Set up stage area`);
      actions.push(`Arrange seating for capacity`);
      actions.push(`Test microphones`);
      actions.push(`Configure audio system`);
    }

    // Add timing-based actions
    // const startHour = event.startTime.getHours();
    // if (startHour < 10) {
    //   actions.push(`Morning check: temperature adjustment`);
    // } else if (startHour > 16) {
    //   actions.push(`Evening check: lighting adjustment`);
    // }

    return actions;
  }
  //#endregion

  getData(startDate, endDate)
    .then((data) => {
      elaborateData(data, selectedDate);
      if (isActionsPage) {
        generateActionCards();
      }
    })
    .catch((error) => {
      console.error("error processing data: ", error);
    });
});

function getRoomData(sensorStation,dataType,column,callback){
  var baseUrl = "https://mobility.api.opendatahub.testingmachine.eu/"
  var StationType = "IndoorStation"
  var query = "v2/flat%2Cnode/"+ StationType+ "/*/latest?limit=1&&offset=0&where=and(sname.eq." + sensorStation + ",tname.eq." + dataType + ")&shownull=false&distinct=true&timezone=+1"
  var link = baseUrl + query;
  $.get(link, (data, status) => {
    if (status == "success"){
      if (column == "timestamp") {
        var timestamp = data.data[0]._timestamp
        callback(timestamp);
      } else {
        unit = ""
        if (dataType == "battery-state"){
          unit = "%"
        } else {
          unit = data.data[0].tunit
        }
        measurement = data.data[0].mvalue + " " + unit
        if (column == "value") {
          callback(measurement)
        }
      }    
    } else {
      console.log("Error: " + status);
    }
  });
}