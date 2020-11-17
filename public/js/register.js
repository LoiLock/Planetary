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
var formResponseInfoTimeout;
function getForm() { // Attempt to register and show message from the server
    var username = document.querySelector(".login-form__username").value;
    var password = document.querySelector(".login-form__password").value;
    register(username, password)
    .then(data => {
        var formResponseInfo = document.querySelector(".form-response-info")
        if (data && data.success) { // * Reload page to force redirect from server after 3 seconds
            setTimeout(() => {
                window.location.href = "/login"
            }, 1500);
        }

        formResponseInfoTimeout = setTimeout(() => { // Clear message after 5 seconds
            formResponseInfo.classList.remove("success", "fail")
        }, 5000);

        if(data.success && data.success == true) {
            formResponseInfo.classList.remove("fail")
            formResponseInfo.classList.add("success")
            formResponseInfo.textContent = data.message
        } else {
            formResponseInfo.classList.remove("success")
            formResponseInfo.classList.add("fail")
            formResponseInfo.textContent = data.message
        }
    })
}

// If successfull, send user to login page
async function register(username, password) {
    var reqBody = {
        username: username,
        password: password
    }
    console.log(JSON.stringify(reqBody))
    const response = await fetch("/register", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(reqBody)
    })
    return response.json()
}