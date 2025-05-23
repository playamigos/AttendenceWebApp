document.addEventListener("DOMContentLoaded", () => {
    const loginScreen = document.getElementById("login-screen");
    const mainScreen = document.getElementById("main-screen");
    const loginButton = document.getElementById("login-button");
    const checkinButton = document.getElementById("checkin-button");
    const checkoutButton = document.getElementById("checkout-button");
    const resetButton = document.getElementById("reset-button");

    const LOCAL_STORAGE_KEY = "attendanceAppUser";
    const PREDEFINED_COORDINATES = { lat: 17.453832400624453, lng: 78.39447955563158 }; // 2020 productions office
    const RADIUS = 500; // in meters

    function loadUser() {
        return JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY));
    }

    function saveUser(user) {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(user));
    }

    function clearUser() {
        localStorage.removeItem(LOCAL_STORAGE_KEY);
    }

    function showLoginScreen() {
        loginScreen.classList.remove("hidden");
        mainScreen.classList.add("hidden");
    }

    function showMainScreen() {
        loginScreen.classList.add("hidden");
        mainScreen.classList.remove("hidden");
    }

    function isWithinRadius(userCoords, predefinedCoords, radius) {
        const toRad = (value) => (value * Math.PI) / 180;
        const earthRadius = 6371000; // in meters

        const dLat = toRad(predefinedCoords.lat - userCoords.lat);
        const dLng = toRad(predefinedCoords.lng - userCoords.lng);

        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRad(userCoords.lat)) *
                Math.cos(toRad(predefinedCoords.lat)) *
                Math.sin(dLng / 2) *
                Math.sin(dLng / 2);

        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = earthRadius * c;

        return distance <= radius;
    }

    function sendDataToSheet(action, username) {
        return fetch(`https://script.google.com/macros/s/AKfycbynFQ-whn8Rg_-r7tP_9ACW6MZgVycB0Kj67pusp0zeVajr2a13rdpNcdwXYkR9s8BC/exec?action=${action}&username=${encodeURIComponent(username)}`, {
            method: "GET",
            redirect: "follow",
        })
            .then((response) => response.json())
            .then((data) => {
                alert(data.message || "Data sent successfully!");
            })
            .catch((error) => {
                console.error("Error:", error);
                alert("Failed to send data.");
            })
            .finally(() => {
                hideLoader();
            });
    }

    function showLoader() {
        document.getElementById("loader-overlay").style.display = "flex";
    }

    function hideLoader() {
        document.getElementById("loader-overlay").style.display = "none";
    }

    loginButton.addEventListener("click", () => {
        const username = document.getElementById("username").value.trim();
        const password = document.getElementById("password").value;

        if (!username) {
            alert("Username cannot be empty.");
            return;
        }

        if (password === "!@#Qwe123") {
            saveUser({ username, password });
            showMainScreen();
        } else {
            alert("Invalid password. Please try again.");
        }
    });

    checkinButton.addEventListener("click", () => {
        const user = loadUser();
        if (!user) return showLoginScreen();

        showLoader();
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const userCoords = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                };

                if (isWithinRadius(userCoords, PREDEFINED_COORDINATES, RADIUS)) {
                    sendDataToSheet("checkin", user.username);
                } else {
                    alert("You are not within the allowed location.");
                    hideLoader();
                }
            },
            () => {
                alert("Failed to get your location.");
                hideLoader();
            }
        );
    });

    checkoutButton.addEventListener("click", () => {
        const user = loadUser();
        if (!user) return showLoginScreen();

        if (!confirm("Are you sure you want to check out?")) return;

        showLoader();
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const userCoords = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                };

                if (isWithinRadius(userCoords, PREDEFINED_COORDINATES, RADIUS)) {
                    sendDataToSheet("checkout", user.username);
                } else {
                    alert("You are not within the allowed location.");
                    hideLoader();
                }
            },
            () => {
                alert("Failed to get your location.");
                hideLoader();
            }
        );
    });

    resetButton.addEventListener("click", () => {
        if (confirm("Are you sure you want to reset the app?")) {
            clearUser();
            showLoginScreen();
        }
    });

    const user = loadUser();
    if (user) {
        showMainScreen();
    } else {
        showLoginScreen();
    }
});
