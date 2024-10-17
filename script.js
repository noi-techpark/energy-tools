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

    // Add synthetic data to verify it works
    addEvent('Seminar 1', new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), 10, 0), new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), 12, 0), 'Morning Meeting');
    addEvent('Seminar 2', new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), 14, 0), new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), 16, 0), 'Afternoon Workshop');
    addEvent('Foyer', new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), 12, 0), new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), 13, 0), 'Lunch Break');
    addEvent('Crane Hall', new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), 18, 0), new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), 20, 0), 'Evening Seminar');
});
