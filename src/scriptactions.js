document.addEventListener("DOMContentLoaded", function () {
    // Set current date
    const currentDate = new Date();
    document.getElementById("current-date").textContent =
      currentDate.toDateString();
})  