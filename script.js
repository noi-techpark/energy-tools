document.addEventListener('DOMContentLoaded', function() {
    // Set current date
    const currentDate = new Date();
    document.getElementById('current-date').textContent = currentDate.toDateString();

    // Generate time slots
    const tableBody = document.querySelector('#calendar-table tbody');
    for (let hour = 9; hour <= 20; hour++) {
        const row = document.createElement('tr');
        const timeCell = document.createElement('td');
        timeCell.textContent = `${hour}:00`;
        row.appendChild(timeCell);

        for (let i = 0; i < 6; i++) {
            const cell = document.createElement('td');
            row.appendChild(cell);
        }

        tableBody.appendChild(row);
    }

    // Function to add events
    function addEvent(room, startTime, endTime, eventName) {
        const startHour = startTime.getHours();
        const endHour = endTime.getHours();
        const duration = endHour - startHour;

        const roomIndex = ['Seminar 1', 'Seminar 2', 'Seminar 3', 'Seminar 4', 'Foyer', 'Crane Hall'].indexOf(room) + 1;
        const rowIndex = startHour - 9;  // Assuming the table starts at 9:00

        const cell = document.querySelector(`#calendar-table tbody tr:nth-child(${rowIndex + 1}) td:nth-child(${roomIndex + 1})`);
        cell.innerHTML = `<div class="event">${eventName}</div>`;
        cell.rowSpan = duration;

        // Remove cells that are now spanned
        for (let i = 1; i < duration; i++) {
            const rowToAdjust = document.querySelector(`#calendar-table tbody tr:nth-child(${rowIndex + 1 + i})`);
            rowToAdjust.deleteCell(roomIndex);
        }
    }

    async function getData(){
        const baseUrl = 'https://tourism.api.opendatahub.com/v1/EventShort';

        const params = new URLSearchParams({
        pagenumber: '1',
        startdate: '2024-10-18T08:00:00',
        enddate: '2024-10-18T20:00:00',
        eventlocation: 'NOI',
        active: 'true',
        sortorder: 'ASC',
        optimizedates: 'true',
        removenullvalues: 'true'
        });

        const url = `${baseUrl}?${params.toString()}`;

        try{
            const response = await fetch(url);
            if(!response.ok){
                throw new Error(`Response status: ${response.status}`);
            }

            const json = await response.json();
            console.log(json.Items);
            console.log(Object.keys(json.Items[2].RoomBooked).length);
            return json;
        }catch(error){
            console.error(error.message);
        }
        

    }

    function elaborateData(data){
        const events = [];
        for(let i=0; i<Object.keys(data.Items).length; i++){
            var roomList = data.Items[i].RoomBooked;
            for (let j=0;j<Object.keys(roomList).length; j++){
                var roomBooked = data.Items[i].RoomBooked[j]
                var present,roomMapped = mapStatus(roomBooked['SpaceDesc']);
                if(present){
                    console.log(roomMapped);
                    var startTime = new Date(roomBooked['StartDate']);
                    var endTime = new Date(roomBooked['EndDate']);
                    var eventName = data.Items[i]['EventDescription'];

                    var event = new EventDTO(roomMapped,startTime,endTime,eventName);  

                    addEvent(event.room,event.startTime,event.endTime,event.eventName);

                }
            }
        }

    }
    //i think the reason why it is not working lies here in the map status function
    function mapStatus(string){
        const roomList = ['Seminar 1', 'Seminar 2', 'Seminar 3', 'Seminar 4', 'Foyer', 'Crane Hall'];
        for(let i=0; i<roomList.length;i++){
            if(string.match(roomList[i])){
                return true,roomList[i];
            }
            else{
                return false,'Not relevant';
            }
        }
    }

    class EventDTO{
        room;
        startTime;
        endTime;
        eventName;

        constructor(data){
            this.room = data.room;
            this.startTime = data.startTime;
            this.endTime = data.endTime;
            this.eventName = data.eventName;
        }
    }

    // Add synthetic data to verify it works
    getData().then(data => {elaborateData(data)});
    //elaborateData(getData());
    //addEvent('Seminar 1', new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), 10, 0), new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), 12, 0), 'Morning Meeting');
    //addEvent('Seminar 2', new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), 14, 0), new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), 16, 0), 'Afternoon Workshop');
    //addEvent('Foyer', new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), 12, 0), new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), 13, 0), 'Lunch Break');
    //addEvent('Crane Hall', new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), 18, 0), new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), 20, 0), 'Evening Seminar');
});
