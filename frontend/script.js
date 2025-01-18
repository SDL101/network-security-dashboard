function fetchFilteredLogs(eventType = "", startDate = "", endDate = "") {
  console.log("Fetching logs with filters...");

  let url = `http://localhost:5000/get_logs?`;
  if (eventType) url += `event_type=${eventType}&`;
  if (startDate) url += `start_date=${startDate}&`;
  if (endDate) url += `end_date=${endDate}&`;

  fetch(url)
    .then((response) => response.json())
    .then((data) => {
      console.log("Filtered API Response Data:", data);
      const tableBody = document.querySelector("#logs-table tbody");
      tableBody.innerHTML = "";

      data.forEach((log) => {
        const formattedDate = new Date(log.timestamp).toLocaleString();
        const isCritical = log.event_type === "failed_login";

        const row = `<tr style="color: ${isCritical ? "red" : "black"};">
                    <td>${formattedDate}</td>
                    <td>${log.source_ip}</td>
                    <td>${log.destination_ip}</td>
                    <td>${log.event_type}</td>
                    <td>${log.details}</td>
                </tr>`;
        tableBody.innerHTML += row;
      });
    })
    .catch((error) => console.error("Error fetching logs:", error));
}
