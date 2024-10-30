// SPDX-FileCopyrightText: 2024 NOI Techpark <digital@noi.bz.it>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

document.addEventListener("DOMContentLoaded", function () {
  const isActionsPage = window.location.pathname.includes("actions.html");
  const isIndexPage = !isActionsPage;

  const currentDate = new Date();
  document.getElementById("current-date").textContent =
    currentDate.toDateString();
  const startDate = getCurrentDateFormatted();
  const endDate = getCurrentDateFormatted(20, 0, 0); 

//#region INDEX PAGE ONLY 
  if (isIndexPage) {
    const tableBody = document.querySelector("#calendar-table tbody");

    for (let hour = 6; hour <= 24; hour++) {
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

      console.log(`LOGGING EVENT'S SCHEDULES:`, startHour, endHour);
 
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

      const rowIndex = startHour - 6;

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

          if (i === 0) {;
            cell.innerHTML = `<div class=${
              startFlag === "half" ? "event-start-30" : "event-start-0"
            }>${eventName}</div>`;
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

//#region

//#region BOTH PAGES SHARED REGION
  async function getData() {
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

  function elaborateData(data) {
    const currentDate = new Date();
    for (let i = 0; i < Object.keys(data.Items).length; i++) {
      let roomList = data.Items[i].RoomBooked;
      for (let j = 0; j < Object.keys(roomList).length; j++) {
        let roomBooked = data.Items[i].RoomBooked[j];
        console.log(roomBooked["SpaceDesc"]);
        const { found, room } = mapStatus(roomBooked["SpaceDesc"]);
        console.log(room);
        if (found) {
          let startTime = new Date(roomBooked["StartDate"]);
          let endTime = new Date(roomBooked["EndDate"]);
          let eventName = data.Items[i]["EventDescription"];
          console.log(startTime);
          console.log(endTime);
          console.log(eventName);
          if (startTime.toDateString() === currentDate.toDateString()) {
            if (isIndexPage) {
              addEvent(room, startTime, endTime, eventName);
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
            console.log("ELABORATE Global events :", globalEvents.length); // Debug log
          } else {
            console.log("Event not on current date, skipping");
          }
        }
      }
    }
  }

  function generateActionCards() {
    const actionsContainer = document.querySelector(".actions-container");
    console.log("Actions container:", actionsContainer); // Debug log
    console.log("Global events:", globalEvents); // Debug log

    if (!actionsContainer) {
      console.log("Actions container not found!");
      return;
    }

    // Clear existing cards
    actionsContainer.innerHTML = "";

    // Sort events by start time
    //globalEvents.sort((a, b) => a.startTime - b.startTime);

    console.log("Generating cards for events:", globalEvents.length); // Debug log

    globalEvents.forEach((event, index) => {
      console.log("Creating card for event:", event); // Debug log
      const actionCard = createActionCard(event, index);
      actionsContainer.appendChild(actionCard);
    });
  }

  function createActionCard(event, index) {
    const card = document.createElement("div");
    card.className = "action-card";

    const startTime = event.startTime.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });

    console.log(`What is this?:`, event.startTime.getHours());
    // Generate appropriate actions based on room type and time
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

  function mapStatus(string) {
    const roomList = [
      "Seminar 1",
      "Seminar 2",
      "Seminar 3",
      "Seminar 4",
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

  function getCurrentDateFormatted(hours = 8, minutes = 0, seconds = 0) {
    const now = new Date();
    now.setHours(hours, minutes, seconds, 0); // Set time to 08:00:00

    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const formattedHours = String(now.getHours()).padStart(2, "0");
    const formattedMinutes = String(now.getMinutes()).padStart(2, "0");
    const formattedSeconds = String(now.getSeconds()).padStart(2, "0");

    return `${year}-${month}-${day}T${formattedHours}:${formattedMinutes}:${formattedSeconds}`;
  }

  //this logic needs to be fixed to fetch the correct data
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

    console.log(
      `Time: ${time}, Hour: ${adjustedHour}, Minutes: ${minutes}, Flag: ${flag}`
    );
    return [adjustedHour, flag];
  }

//#region

  getData()
    .then((data) => {
      elaborateData(data);
      if (isActionsPage) {
        generateActionCards();
      }
    })
    .catch((error) => {
      console.error("error processing data: ", error);
    });
});
