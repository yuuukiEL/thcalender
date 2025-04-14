$.ajax({
    url: '/api/personal-schedule',
    method: 'POST',
    contentType: 'application/json',
    success: function(response) {
        calendar.addEventSource(response);
    },
    error: function(xhr, status, error) {
        console.error('Error fetching events:', error);
    }
}); 