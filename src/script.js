// SPDX-FileCopyrightText: 2024 NOI Techpark <digital@noi.bz.it>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

document.addEventListener("DOMContentLoaded", function () {
  // Set current date
  const currentDate = new Date();
  document.getElementById("current-date").textContent =
    currentDate.toDateString();

  // Generate time slots hkuykuh
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

  const startDate = getCurrentDateFormatted();
  const endDate = getCurrentDateFormatted(20, 0, 0); // Set to 20:00:00

  // Function to add events
  function addEvent(room, startTime, endTime, eventName) {
    const [startHour, startFlag] = getCorrectHour(startTime, "start");
    const [endHour, endFlag] = getCorrectHour(endTime);
    console.log("WATCHOUT");
    console.log(startHour)
    console.log(endHour);
    console.log(endFlag);
    let duration = endHour - startHour;
    if(endFlag === "half"){
      duration = duration +1;
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

    console.log("ROOM");
    console.log(room);

    // Fill each cell for the duration of the event
    for (let i = 0; i < duration; i++) {
      const cell = document.querySelector(
        `#calendar-table tbody tr:nth-child(${rowIndex + 1 + i}) td:nth-child(${
          roomIndex + 2
        })`
      );

      if (cell) {
        cell.classList.add("event-cell");
        if (i === 0) {
          // cell.innerHTML = `<div class="event">${eventName}</div>`;
          cell.innerHTML = `<div class=${startFlag === "half" ? "event-start-30" : "event-start-0"}>${eventName}</div>`;
        }
        else if (i === duration-1) {
          //cell.innerHTML = `<div class="event">${eventName}</div>`;
          cell.innerHTML = `<div class=${endFlag === "half" ? "event-end-30" : "event-end-0"}>${eventName}</div>`;
        }else{
          cell.innerHTML = `<div class="event-start-0"></div>`;
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
            addEvent(room, startTime, endTime, eventName);
          } else {
            console.log("Event not on current date, skipping");
          }
        }
      }
    }
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

  getData().then((data) => {
    elaborateData(data);
  });
});
