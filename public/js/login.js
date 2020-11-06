window.onload = function() {
    var login_btn = document.querySelector(".login-form .confirm-action")
    var pwInput = document.querySelector(".login-form__password")
    login_btn.addEventListener("click", getForm, false)
    pwInput.addEventListener("keyup", function(event) {
        if (event.key == "Enter" && event.keyCode == 13) {
            getForm()
        }
    }, false)

}
function getForm() {
    var username = document.querySelector(".login-form__username").value;
    var password = document.querySelector(".login-form__password").value;
    signin(username, password)
    .then(data => {
        console.log(data)
    })
}

// If successfull, server returns JWT token which will be set as cookie to be accessed from the server
async function signin(username, password) {
    var reqBody = {
        username: username,
        password: password
    }
    // console.log(JSON.stringify(reqBody))
    const response = await fetch("/login", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(reqBody)
    })
    var result = await response.json()
    console.log(result)
    if (result && result.success) {
        document.cookie = `token=${result.token}`
        window.location.href = "/dashboard" + "?n=" + Date.now() // Prevent browser from caching redirect back to /login
    }
}