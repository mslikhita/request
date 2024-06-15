document.getElementById('requestForm').addEventListener('submit', function(event) {
    event.preventDefault();
    
    const formData = new FormData();
    formData.append('email_id', document.getElementById('email').value);
    formData.append('designation', document.getElementById('designation').value);
    formData.append('skills', document.getElementById('skills').value);
    formData.append('experience', document.getElementById('experience').value);
    formData.append('job_description', document.getElementById('jobDescription').files[0]);

    fetch('http://localhost:3000/requests', {
        method: 'POST',
        body: formData
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json(); // Parse response as JSON
    })
    .then(data => {
        document.getElementById('message').innerText = data.message;
        // Optionally clear the form after successful submission
        document.getElementById('requestForm').reset();
    })
    .catch(error => {
        console.error('Error:', error);
        document.getElementById('message').innerText = 'An error occurred while submitting the request';
    });
});
