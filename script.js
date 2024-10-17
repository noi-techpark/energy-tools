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

    // TODO: Add function to populate events from API
});
