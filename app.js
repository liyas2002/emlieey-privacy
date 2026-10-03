const API =
  "https://emlieey-ai.liyasmuhammedmv.workers.dev";

const USER_KEY = "emlee_username";

const $ = (selector) =>
  document.querySelector(selector);


function escapeHTML(value) {

  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

}


async function apiRequest(
  path,
  options = {}
) {

  const config = {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  };

  const response =
    await fetch(API + path, config);

  let data = null;

  try {
    data = await response.json();
  } catch (_) {
    data = {};
  }

  if (!response.ok) {

    throw new Error(
      data?.error ||
      data?.message ||
      `request failed: ${response.status}`
    );

  }

  return data;

}


function getSavedUsername() {

  return localStorage.getItem(USER_KEY) || "";

}


function saveUsername(username) {

  localStorage.setItem(
    USER_KEY,
    username.trim()
  );

}


function getActiveUsername() {

  return getSavedUsername();

}


function getInitial(username) {

  if (!username) return "?";

  return username
    .trim()
    .charAt(0)
    .toUpperCase();

}


function showMessage(message) {

  const toast = $("#toast");

  if (!toast) {
    alert(message);
    return;
  }

  toast.textContent = message;

  toast.classList.add("show");

  clearTimeout(window.__toastTimer);

  window.__toastTimer =
    setTimeout(() => {
      toast.classList.remove("show");
    }, 2500);

}


async function createOrGetUser(username) {

  return apiRequest(
    "/api/user",
    {
      method: "POST",
      body: JSON.stringify({
        username
      })
    }
  );

}


async function loadProfile(username) {

  if (!username) return null;

  try {

    return await apiRequest(
      "/api/user?id=" +
      encodeURIComponent(username)
    );

  } catch (error) {

    console.warn(
      "profile load failed:",
      error
    );

    return null;

  }

}


function updateHeader(username) {

  const name =
    username || getSavedUsername();

  const avatar =
    $("#headerAvatar");

  const usernameEl =
    $("#headerUsername");

  if (avatar) {
    avatar.textContent =
      getInitial(name);
  }

  if (usernameEl) {
    usernameEl.textContent =
      name || "profile";
  }

}


function updateCurrentYear() {

  document
    .querySelectorAll(".current-year")
    .forEach(el => {

      el.textContent =
        new Date().getFullYear();

    });

}


async function requestUsername() {

  const modal =
    $("#usernameModal");

  const input =
    $("#usernameInput");

  if (!modal || !input) return;

  modal.classList.remove("hidden");

  input.focus();

  const submit = async () => {

    const username =
      input.value.trim();

    if (!username) {

      showMessage(
        "enter a username first"
      );

      return;

    }

    if (username.length < 2) {

      showMessage(
        "username is too short"
      );

      return;

    }

    try {

      await createOrGetUser(
        username
      );

      saveUsername(username);

      modal.classList.add("hidden");

      updateHeader(username);

      await refreshCurrentUser();

    } catch (error) {

      showMessage(
        error.message ||
        "could not create profile"
      );

    }

  };


  const button =
    $("#usernameContinue");

  if (button) {

    button.onclick = submit;

  }


  input.onkeydown = event => {

    if (event.key === "Enter") {

      submit();

    }

  };

}


async function refreshCurrentUser() {

  const username =
    getSavedUsername();

  if (!username) return null;

  const profile =
    await loadProfile(username);

  if (!profile) return null;

  window.currentProfile =
    profile;

  renderBasicProfile(
    profile
  );

  return profile;

}


function renderBasicProfile(profile) {

  const username =
    profile.username ||
    getSavedUsername();

  updateHeader(username);

  const heroUsername =
    $("#heroUsername");

  const heroAvatar =
    $("#heroAvatar");

  const heroPoints =
    $("#heroPoints");

  const heroRank =
    $("#heroRank");

  const heroLevel =
    $("#heroLevel");

  const heroStreak =
    $("#heroStreak");


  if (heroUsername) {

    heroUsername.textContent =
      username;

  }

  if (heroAvatar) {

    heroAvatar.textContent =
      getInitial(username);

  }

  if (heroPoints) {

    heroPoints.textContent =
      Number(
        profile.points ?? 0
      ).toLocaleString();

  }

  if (heroRank) {

    heroRank.textContent =
      profile.rank ??
      profile.position ??
      "—";

  }

  if (heroLevel) {

    heroLevel.textContent =
      "level " +
      (profile.level ?? 1);

  }

  if (heroStreak) {

    heroStreak.textContent =
      profile.streak ??
      profile.daily_streak ??
      0;

  }

}


async function loadOnlineCount() {

  const element =
    $("#onlineCount");

  if (!element) return;

  try {

    const data =
      await apiRequest(
        "/api/online"
      );

    const count =
      data.count ??
      data.online ??
      data.total ??
      0;

    element.textContent =
      Number(count).toLocaleString();

  } catch (error) {

    console.warn(
      "online count failed",
      error
    );

  }

}


function initializeHome() {

  updateCurrentYear();

  const username =
    getSavedUsername();

  updateHeader(username);

  if (!username) {

    requestUsername();

  } else {

    refreshCurrentUser();

  }

  loadOnlineCount();

  setInterval(
    loadOnlineCount,
    30000
  );

}
