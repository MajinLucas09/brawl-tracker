// =========================================================
// BRAWL TRACKER V2
// SCRIPT PRINCIPAL
// =========================================================


// =========================================================
// CONFIGURATION
// =========================================================

const SERVER_URL = "";

const PLAYER_TAG_KEY =
    "brawlTrackerPlayerTag";

const CHALLENGE_KEY =
    "brawlTrackerChallenge";

const HISTORY_KEY =
    "brawlTrackerHistory";


// Cache des icônes
let playerIconsCache = null;


// Données du joueur actuellement chargées
let currentPlayerData = null;


// =========================================================
// OUTILS
// =========================================================

function getElement(id) {

    return document.getElementById(id);
}


function formatNumber(value) {

    const number = Number(value) || 0;

    return number.toLocaleString("fr-FR");
}


function getTodayString() {

    const date = new Date();

    const year =
        date.getFullYear();

    const month =
        String(date.getMonth() + 1).padStart(2, "0");

    const day =
        String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}


function parseDate(value) {

    if (!value) {
        return null;
    }

    const parts =
        value.split("-").map(Number);

    if (parts.length !== 3) {
        return null;
    }

    return new Date(
        parts[0],
        parts[1] - 1,
        parts[2]
    );
}


function formatDate(value) {

    const date =
        value instanceof Date
            ? value
            : parseDate(value);

    if (!date) {
        return "-";
    }

    return date.toLocaleDateString(
        "fr-FR"
    );
}


function daysBetween(start, end) {

    if (!start || !end) {
        return 0;
    }

    const startTime =
        start.getTime();

    const endTime =
        end.getTime();

    const difference =
        endTime - startTime;

    return Math.max(
        0,
        Math.ceil(
            difference /
            (1000 * 60 * 60 * 24)
        )
    );
}


// =========================================================
// TOAST
// =========================================================

let toastTimeout = null;


function showToast(message) {

    const toast =
        getElement("toast");

    if (!toast) {
        return;
    }

    toast.textContent =
        message;

    toast.classList.add("show");

    clearTimeout(toastTimeout);

    toastTimeout =
        setTimeout(() => {

            toast.classList.remove("show");

        }, 3500);
}


// =========================================================
// LOADING
// =========================================================

function setLoading(isLoading) {

    const overlay =
        getElement("loadingOverlay");

    if (!overlay) {
        return;
    }

    overlay.classList.toggle(
        "active",
        isLoading
    );
}


// =========================================================
// PLAYER TAG
// =========================================================

function getPlayerTag() {

    const input =
        getElement("playerTag");

    if (!input) {
        return "";
    }

    return input.value
        .trim()
        .toUpperCase();
}


function savePlayerTag(tag) {

    if (!tag) {
        return;
    }

    localStorage.setItem(
        PLAYER_TAG_KEY,
        tag
    );
}


function loadPlayerTag() {

    const savedTag =
        localStorage.getItem(
            PLAYER_TAG_KEY
        );

    const input =
        getElement("playerTag");

    if (input && savedTag) {

        input.value =
            savedTag;
    }

    return savedTag || "";
}


// =========================================================
// API JOUEUR
// =========================================================

async function getPlayerData(tag) {

    if (!tag) {

        throw new Error(
            "Entre ton Player Tag."
        );
    }

    const cleanTag =
        tag.startsWith("#")
            ? tag
            : `#${tag}`;

    const url =
        `${SERVER_URL}/api/player/${encodeURIComponent(cleanTag)}`;

    const response =
        await fetch(url);

    let data;

    try {

        data =
            await response.json();

    } catch {

        throw new Error(
            "Le serveur a renvoyé une réponse invalide."
        );
    }


    if (!response.ok) {

        let message =
            "Impossible de récupérer le joueur.";

        if (data && data.error) {

            if (typeof data.error === "string") {

                message =
                    data.error;

            } else if (data.error.reason) {

                message =
                    data.error.reason;

            } else if (data.error.message) {

                message =
                    data.error.message;
            }
        }

        throw new Error(message);
    }

    return data;
}


// =========================================================
// ICÔNE DU JOUEUR
// =========================================================

async function loadPlayerIcon(iconId) {

    const image =
        getElement("playerAvatar");

    const fallback =
        getElement("avatarFallback");

    if (!image || !fallback) {
        return;
    }


    if (!iconId) {

        image.style.display =
            "none";

        fallback.style.display =
            "block";

        return;
    }


    try {

        if (!playerIconsCache) {

            const response =
                await fetch(
                    "https://api.brawlapi.com/v1/icons"
                );

            if (!response.ok) {

                throw new Error(
                    "Impossible de récupérer les icônes."
                );
            }

            playerIconsCache =
                await response.json();
        }


        const playerIcons =
            playerIconsCache.player || {};


        const icon =
            playerIcons[
                String(iconId)
            ];


        if (!icon || !icon.imageUrl) {

            image.style.display =
                "none";

            fallback.style.display =
                "block";

            return;
        }


        image.src =
            icon.imageUrl;


        image.onload = () => {

            image.style.display =
                "block";

            fallback.style.display =
                "none";
        };


        image.onerror = () => {

            image.style.display =
                "none";

            fallback.style.display =
                "block";
        };

    } catch (error) {

        console.error(
            "Erreur icône :",
            error
        );

        image.style.display =
            "none";

        fallback.style.display =
            "block";
    }
}


// =========================================================
// PROFIL
// =========================================================

function updateProfile(data) {

    currentPlayerData =
        data;


    const name =
        getElement("playerName");

    const tag =
        getElement("playerTagDisplay");

    const club =
        getElement("playerClub");

    const trophies =
        getElement("profileTrophies");

    const highest =
        getElement("profileHighestTrophies");

    const expLevel =
        getElement("profileExpLevel");

    const victories3v3 =
        getElement("profile3v3");

    const solo =
        getElement("profileSolo");

    const duo =
        getElement("profileDuo");

    const brawlers =
        getElement("profileBrawlers");


    if (name) {

        name.textContent =
            data.name || "Joueur";
    }


    if (tag) {

        tag.textContent =
            data.tag || "#??????";
    }


    if (club) {

        if (data.club && data.club.name) {

            club.textContent =
                `🏰 ${data.club.name}`;

        } else {

            club.textContent =
                "Aucun club";
        }
    }


    if (trophies) {

        trophies.textContent =
            formatNumber(
                data.trophies
            );
    }


    if (highest) {

        highest.textContent =
            formatNumber(
                data.highestTrophies
            );
    }


    if (expLevel) {

        expLevel.textContent =
            formatNumber(
                data.expLevel
            );
    }


    if (victories3v3) {

        victories3v3.textContent =
            formatNumber(
                data["3vs3Victories"]
            );
    }


    if (solo) {

        solo.textContent =
            formatNumber(
                data.soloVictories
            );
    }


    if (duo) {

        duo.textContent =
            formatNumber(
                data.duoVictories
            );
    }


    if (brawlers) {

        brawlers.textContent =
            formatNumber(
                Array.isArray(data.brawlers)
                    ? data.brawlers.length
                    : 0
            );
    }


    const currentTrophies =
        getElement("currentTrophies");

    if (currentTrophies) {

        currentTrophies.value =
            data.trophies || 0;
    }


    updateRecords(data);

    updateGoal(data);

    updateBrawlerCount(data);

    renderBrawlers();

    updateHistoryStats();
}


// =========================================================
// RECORDS
// =========================================================

function updateRecords(data) {

    const recordTrophies =
        getElement("recordTrophies");

    const record3v3 =
        getElement("record3v3");

    const recordSolo =
        getElement("recordSolo");

    const recordDuo =
        getElement("recordDuo");

    const recordRobo =
        getElement("recordRobo");

    const recordBig =
        getElement("recordBigBrawler");


    if (recordTrophies) {

        recordTrophies.textContent =
            formatNumber(
                data.highestTrophies
            );
    }


    if (record3v3) {

        record3v3.textContent =
            formatNumber(
                data["3vs3Victories"]
            );
    }


    if (recordSolo) {

        recordSolo.textContent =
            formatNumber(
                data.soloVictories
            );
    }


    if (recordDuo) {

        recordDuo.textContent =
            formatNumber(
                data.duoVictories
            );
    }


    if (recordRobo) {

        recordRobo.textContent =
            formatTime(
                data.bestRoboRumbleTime
            );
    }


    if (recordBig) {

        recordBig.textContent =
            formatTime(
                data.bestTimeAsBigBrawler
            );
    }
}


function formatTime(value) {

    if (
        value === undefined ||
        value === null ||
        value === 0
    ) {
        return "—";
    }

    const number =
        Number(value);

    if (!Number.isFinite(number)) {
        return "—";
    }

    return formatNumber(number);
}


// =========================================================
// CHALLENGE
// =========================================================

function getChallenge() {

    const raw =
        localStorage.getItem(
            CHALLENGE_KEY
        );

    if (!raw) {
        return null;
    }

    try {

        return JSON.parse(raw);

    } catch {

        return null;
    }
}


function saveChallenge(challenge) {

    localStorage.setItem(
        CHALLENGE_KEY,
        JSON.stringify(challenge)
    );
}


function calculateChallenge() {

    const targetInput =
        getElement("targetTrophies");

    const startInput =
        getElement("startDate");

    const endInput =
        getElement("endDate");

    const currentInput =
        getElement("currentTrophies");


    const current =
        Number(currentInput?.value) || 0;

    const target =
        Number(targetInput?.value) || 0;

    const start =
        parseDate(
            startInput?.value
        );

    const end =
        parseDate(
            endInput?.value
        );


    if (target <= 0) {

        showToast(
            "Entre un objectif de trophées."
        );

        return;
    }


    if (!start || !end) {

        showToast(
            "Choisis une date de début et une date de fin."
        );

        return;
    }


    if (end < start) {

        showToast(
            "La date de fin doit être après la date de début."
        );

        return;
    }


    if (target <= current) {

        showToast(
            "Ton objectif doit être supérieur à tes trophées actuels."
        );

        return;
    }


    const totalDays =
        Math.max(
            1,
            daysBetween(
                start,
                end
            )
        );


    const needed =
        target - current;


    const daily =
        needed / totalDays;


    const challenge = {

        current,
        target,

        startDate:
            startInput.value,

        endDate:
            endInput.value,

        dailyGoal:
            daily,

        createdAt:
            new Date().toISOString()
    };


    saveChallenge(
        challenge
    );


    displayChallenge(
        challenge
    );


    updateGoal(
        currentPlayerData
    );


    showToast(
        "🎯 Challenge enregistré !"
    );
}


function displayChallenge(challenge) {

    if (!challenge) {

        const result =
            getElement("challengeResult");

        if (result) {
            result.innerHTML = "";
        }

        return;
    }


    const now =
        new Date();

    const start =
        parseDate(
            challenge.startDate
        );

    const end =
        parseDate(
            challenge.endDate
        );


    const elapsed =
        Math.max(
            0,
            daysBetween(
                start,
                now > end
                    ? end
                    : now
            )
        );


    const totalDays =
        Math.max(
            1,
            daysBetween(
                start,
                end
            )
        );


    const current =
        currentPlayerData?.trophies ??
        challenge.current;


    const gained =
        current -
        challenge.current;


    const remaining =
        Math.max(
            0,
            challenge.target - current
        );


    const percentage =
        Math.min(
            100,
            Math.max(
                0,
                (
                    gained /
                    (
                        challenge.target -
                        challenge.current
                    )
                ) * 100
            )
        );


    const theoretical =
        Math.min(
            challenge.target,
            challenge.current +
            challenge.dailyGoal *
            elapsed
        );


    let statusClass =
        "on-track";

    let statusText =
        "Dans les temps";


    if (current > theoretical + 100) {

        statusClass =
            "ahead";

        statusText =
            "En avance";

    } else if (current < theoretical - 100) {

        statusClass =
            "behind";

        statusText =
            "En retard";
    }


    const result =
        getElement("challengeResult");


    if (result) {

        result.innerHTML = `

            <div class="challenge-box">

                <h3>🎯 ${statusText}</h3>

                <div class="challenge-line">

                    <span>Objectif</span>

                    <strong>
                        ${formatNumber(challenge.target)}
                    </strong>

                </div>

                <div class="challenge-line">

                    <span>À gagner</span>

                    <strong>
                        ${formatNumber(remaining)}
                    </strong>

                </div>

                <div class="challenge-line">

                    <span>Objectif quotidien</span>

                    <strong>
                        ${formatNumber(Math.ceil(challenge.dailyGoal))}
                    </strong>

                </div>

                <div class="challenge-line">

                    <span>Progression</span>

                    <strong class="${statusClass}">
                        ${percentage.toFixed(1)} %
                    </strong>

                </div>

                <div class="progress-bar" style="margin-top:15px;">

                    <div
                        class="progress-fill"
                        style="width:${percentage}%;">
                    </div>

                </div>

            </div>
        `;
    }


    const gainedElement =
        getElement("challengeGained");

    const dailyElement =
        getElement("challengeDaily");

    const daysElement =
        getElement("challengeDays");

    const progressElement =
        getElement("challengeProgress");


    if (gainedElement) {

        gainedElement.textContent =
            formatNumber(
                Math.max(0, gained)
            );
    }


    if (dailyElement) {

        dailyElement.textContent =
            formatNumber(
                Math.ceil(
                    challenge.dailyGoal
                )
            );
    }


    if (daysElement) {

        daysElement.textContent =
            formatNumber(
                Math.max(
                    0,
                    daysBetween(
                        new Date(),
                        end
                    )
                )
            );
    }


    if (progressElement) {

        progressElement.textContent =
            `${percentage.toFixed(1)}%`;
    }
}


// =========================================================
// OBJECTIF DU PROFIL
// =========================================================

function updateGoal(data) {

    const challenge =
        getChallenge();


    const current =
        data?.trophies ??
        challenge?.current ??
        0;


    const goalCurrent =
        getElement("goalCurrent");

    const goalTarget =
        getElement("goalTarget");

    const goalRemaining =
        getElement("goalRemaining");

    const goalPercentage =
        getElement("goalPercentage");

    const progressBar =
        getElement("goalProgressBar");


    if (goalCurrent) {

        goalCurrent.textContent =
            formatNumber(current);
    }


    if (!challenge) {

        if (goalTarget) {
            goalTarget.textContent =
                "Aucun";
        }

        if (goalRemaining) {
            goalRemaining.textContent =
                "-";
        }

        if (goalPercentage) {
            goalPercentage.textContent =
                "0%";
        }

        if (progressBar) {
            progressBar.style.width =
                "0%";
        }

        return;
    }


    const total =
        challenge.target -
        challenge.current;


    const gained =
        current -
        challenge.current;


    const percentage =
        total > 0
            ? Math.min(
                100,
                Math.max(
                    0,
                    (gained / total) * 100
                )
            )
            : 0;


    if (goalTarget) {

        goalTarget.textContent =
            formatNumber(
                challenge.target
            );
    }


    if (goalRemaining) {

        goalRemaining.textContent =
            formatNumber(
                Math.max(
                    0,
                    challenge.target -
                    current
                )
            );
    }


    if (goalPercentage) {

        goalPercentage.textContent =
            `${percentage.toFixed(1)}%`;
    }


    if (progressBar) {

        progressBar.style.width =
            `${percentage}%`;
    }


    displayChallenge(
        challenge
    );
}


// =========================================================
// HISTORIQUE
// =========================================================

function getHistory() {

    const raw =
        localStorage.getItem(
            HISTORY_KEY
        );

    if (!raw) {
        return [];
    }

    try {

        const history =
            JSON.parse(raw);

        return Array.isArray(history)
            ? history
            : [];

    } catch {

        return [];
    }
}


function saveHistory(history) {

    localStorage.setItem(
        HISTORY_KEY,
        JSON.stringify(history)
    );
}


function addHistoryPoint(trophies) {

    const history =
        getHistory();

    const today =
        getTodayString();


    const existingIndex =
        history.findIndex(
            item =>
                item.date === today
        );


    if (existingIndex >= 0) {

        history[existingIndex].trophies =
            trophies;

    } else {

        history.push({

            date: today,

            trophies:
                trophies

        });
    }


    history.sort(
        (a, b) =>
            a.date.localeCompare(b.date)
    );


    saveHistory(
        history
    );
}


// =========================================================
// HISTORIQUE — STATS
// =========================================================

function updateHistoryStats() {

    const history =
        getHistory();


    const current =
        currentPlayerData?.trophies ??
        (
            history.length
                ? history[history.length - 1].trophies
                : 0
        );


    let gain =
        0;

    let best =
        0;


    for (let i = 1; i < history.length; i++) {

        const difference =
            Number(history[i].trophies) -
            Number(history[i - 1].trophies);


        if (difference > 0) {

            gain += difference;

            best =
                Math.max(
                    best,
                    difference
                );
        }
    }


    const first =
        history.length
            ? Number(history[0].trophies)
            : current;


    const totalGain =
        Math.max(
            0,
            Number(current) -
            first
        );


    setText(
        "historyCurrent",
        formatNumber(current)
    );

    setText(
        "historyGain",
        formatNumber(totalGain)
    );

    setText(
        "historyBest",
        formatNumber(best)
    );

    setText(
        "gainedTrophies",
        formatNumber(totalGain)
    );

    setText(
        "bestDay",
        formatNumber(best)
    );

    setText(
        "trackedDays",
        formatNumber(
            history.length
        )
    );


    renderHistoryList();

    updateTrophyChart();
}


// =========================================================
// HISTORIQUE — LISTE
// =========================================================

function renderHistoryList() {

    const container =
        getElement("historyList");

    if (!container) {
        return;
    }


    const history =
        getHistory();


    if (!history.length) {

        container.innerHTML = `

            <div class="empty-state">

                <span>📅</span>

                <p>
                    Aucun historique enregistré.
                </p>

            </div>
        `;

        return;
    }


    const recent =
        [...history]
            .reverse()
            .slice(0, 15);


    container.innerHTML =
        recent.map(
            (item, index) => {

                const next =
                    recent[index + 1];

                let difference = 0;

                if (next) {

                    difference =
                        Number(item.trophies) -
                        Number(next.trophies);
                }


                let differenceHtml =
                    "—";

                if (next) {

                    differenceHtml =
                        difference >= 0
                            ? `<span class="history-positive">+${formatNumber(difference)}</span>`
                            : `<span class="history-negative">${formatNumber(difference)}</span>`;
                }


                return `

                    <div class="history-row">

                        <span>
                            📅 ${formatDate(item.date)}
                        </span>

                        <strong>
                            🏆 ${formatNumber(item.trophies)}
                        </strong>

                        <strong>
                            ${differenceHtml}
                        </strong>

                    </div>
                `;
            }
        ).join("");
}


// =========================================================
// GRAPHIQUE
// =========================================================

function updateTrophyChart() {

    const container =
        getElement("trophyChart");

    if (!container) {
        return;
    }


    const history =
        getHistory();


    if (history.length < 2) {

        container.innerHTML = `

            <div class="empty-chart">

                Il faut au moins deux jours
                d'historique pour afficher le graphique.

            </div>
        `;

        return;
    }


    const width =
        1000;

    const height =
        350;

    const padding =
        45;


    const values =
        history.map(
            item =>
                Number(item.trophies)
        );


    const minValue =
        Math.min(...values);

    const maxValue =
        Math.max(...values);


    const range =
        Math.max(
            1,
            maxValue - minValue
        );


    function getX(index) {

        if (history.length === 1) {
            return width / 2;
        }

        return (
            padding +
            (
                index /
                (history.length - 1)
            ) *
            (
                width -
                padding * 2
            )
        );
    }


    function getY(value) {

        return (
            height -
            padding -
            (
                (value - minValue) /
                range
            ) *
            (
                height -
                padding * 2
            )
        );
    }


    const realPoints =
        values.map(
            (value, index) =>
                `${getX(index)},${getY(value)}`
        ).join(" ");


    const challenge =
        getChallenge();


    let theoreticalPoints =
        "";


    if (challenge) {

        const start =
            parseDate(
                challenge.startDate
            );

        const daily =
            Number(
                challenge.dailyGoal
            ) || 0;


        theoreticalPoints =
            history.map(
                (item, index) => {

                    const date =
                        parseDate(
                            item.date
                        );

                    const days =
                        daysBetween(
                            start,
                            date
                        );


                    const theoretical =
                        Math.min(
                            challenge.target,
                            challenge.current +
                            daily *
                            days
                        );


                    return `${getX(index)},${getY(theoretical)}`;
                }
            ).join(" ");
    }


    let gridLines = "";


    for (let i = 0; i <= 4; i++) {

        const y =
            padding +
            i *
            (
                (
                    height -
                    padding * 2
                ) / 4
            );


        const value =
            maxValue -
            (
                i / 4
            ) *
            range;


        gridLines += `

            <line
                x1="${padding}"
                y1="${y}"
                x2="${width - padding}"
                y2="${y}"
                stroke="rgba(113,129,165,0.15)"
                stroke-width="1"
            />

            <text
                x="8"
                y="${y + 4}"
                fill="#7181a5"
                font-size="11"
            >
                ${Math.round(value).toLocaleString("fr-FR")}
            </text>
        `;
    }


    let points =
        "";


    values.forEach(
        (value, index) => {

            points += `

                <circle
                    cx="${getX(index)}"
                    cy="${getY(value)}"
                    r="4"
                    fill="#ffd21c"
                />
            `;
        }
    );


    const theoretical =
        theoreticalPoints
            ? `

                <polyline
                    points="${theoreticalPoints}"
                    fill="none"
                    stroke="#168cff"
                    stroke-width="3"
                    stroke-dasharray="7 7"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                />
            `
            : "";


    container.innerHTML = `

        <svg
            viewBox="0 0 ${width} ${height}"
            preserveAspectRatio="none">

            ${gridLines}

            ${theoretical}

            <polyline
                points="${realPoints}"
                fill="none"
                stroke="#ffd21c"
                stroke-width="4"
                stroke-linecap="round"
                stroke-linejoin="round"
            />

            ${points}

        </svg>
    `;
}


// =========================================================
// BRAWLERS
// =========================================================

function updateBrawlerCount(data) {

    const count =
        Array.isArray(data?.brawlers)
            ? data.brawlers.length
            : 0;


    setText(
        "brawlerCount",
        count
    );
}


function getSortedBrawlers() {

    if (
        !currentPlayerData ||
        !Array.isArray(
            currentPlayerData.brawlers
        )
    ) {
        return [];
    }


    const brawlers =
        [...currentPlayerData.brawlers];


    const sort =
        getElement("brawlerSort")?.value ||
        "trophies";


    brawlers.sort(
        (a, b) => {

            if (sort === "trophies") {

                return (
                    (b.trophies || 0) -
                    (a.trophies || 0)
                );
            }


            if (sort === "level") {

                return (
                    (b.power || 0) -
                    (a.power || 0)
                );
            }


            if (sort === "rank") {

                return (
                    (b.rank || 0) -
                    (a.rank || 0)
                );
            }


            if (sort === "name") {

                return String(
                    a.name || ""
                ).localeCompare(
                    String(
                        b.name || ""
                    ),
                    "fr"
                );
            }


            return 0;
        }
    );


    return brawlers;
}


function getBrawlerSearch() {

    return (
        getElement("brawlerSearch")?.value ||
        ""
    )
        .trim()
        .toLowerCase();
}


function renderBrawlers() {

    const container =
        getElement("brawlersGrid");

    if (!container) {
        return;
    }


    const allBrawlers =
        getSortedBrawlers();


    if (!allBrawlers.length) {

        container.innerHTML = `

            <div class="empty-state">

                <span>👊</span>

                <p>
                    Entre ton Player Tag
                    pour afficher tes brawlers.
                </p>

            </div>
        `;

        return;
    }


    const search =
        getBrawlerSearch();


    const brawlers =
        allBrawlers.filter(
            brawler => {

                const name =
                    String(
                        brawler.name || ""
                    ).toLowerCase();

                return name.includes(
                    search
                );
            }
        );


    if (!brawlers.length) {

        container.innerHTML = `

            <div class="empty-state">

                <span>🔎</span>

                <p>
                    Aucun brawler trouvé.
                </p>

            </div>
        `;

        return;
    }


    container.innerHTML =
        brawlers.map(
            brawler =>
                createBrawlerCard(
                    brawler
                )
        ).join("");


    loadBrawlerImages();
}


function createBrawlerCard(brawler) {

    const name =
        brawler.name ||
        "Brawler";


    const trophies =
        Number(
            brawler.trophies
        ) || 0;


    const highest =
        Number(
            brawler.highestTrophies
        ) || 0;


    const power =
        Number(
            brawler.power
        ) || 0;


    const rank =
        Number(
            brawler.rank
        ) || 0;


    const id =
        brawler.id ??
        brawler.brawler?.id ??
        "";


    return `

        <div
            class="brawler-card"
            data-brawler-id="${id}"
            data-brawler-name="${escapeHtml(name)}">

            <div class="brawler-header">

                <img
                    class="brawler-image"
                    data-brawler-image="${id}"
                    src=""
                    alt="${escapeHtml(name)}"
                >

                <div>

                    <div class="brawler-name">
                        ${escapeHtml(name)}
                    </div>

                    <div class="brawler-rank">
                        Rang ${rank || "—"}
                    </div>

                </div>

            </div>


            <div class="brawler-stats">

                <div class="brawler-stat">

                    <span>Trophées</span>

                    <strong class="brawler-trophies">
                        🏆 ${formatNumber(trophies)}
                    </strong>

                </div>


                <div class="brawler-stat">

                    <span>Record</span>

                    <strong>
                        ${formatNumber(highest)}
                    </strong>

                </div>


                <div class="brawler-stat">

                    <span>Niveau</span>

                    <strong>
                        ⚡ ${power}
                    </strong>

                </div>


                <div class="brawler-stat">

                    <span>Rang</span>

                    <strong>
                        #${rank || "—"}
                    </strong>

                </div>

            </div>

        </div>
    `;
}


// =========================================================
// IMAGES BRAWLERS
// =========================================================

async function loadBrawlerImages() {

    const images =
        document.querySelectorAll(
            "[data-brawler-image]"
        );


    if (!images.length) {
        return;
    }


    try {

        if (!playerIconsCache) {

            const response =
                await fetch(
                    "https://api.brawlapi.com/v1/icons"
                );

            if (!response.ok) {
                return;
            }

            playerIconsCache =
                await response.json();
        }


        /*
         * L'API BrawlAPI des icônes concerne
         * principalement les icônes joueur/club.
         *
         * Les brawlers peuvent avoir une structure
         * différente selon la version de l'API.
         *
         * On tente donc plusieurs sources connues.
         */

        let brawlerData = null;


        try {

            const response =
                await fetch(
                    "https://api.brawlapi.com/v1/brawlers"
                );

            if (response.ok) {

                brawlerData =
                    await response.json();
            }

        } catch {

            brawlerData = null;
        }


        if (!brawlerData) {

            images.forEach(
                image => {

                    image.style.display =
                        "none";

                    createBrawlerFallback(
                        image
                    );
                }
            );

            return;
        }


        const list =
            Array.isArray(
                brawlerData.list
            )
                ? brawlerData.list
                : Array.isArray(
                    brawlerData
                )
                    ? brawlerData
                    : [];


        images.forEach(
            image => {

                const id =
                    String(
                        image.dataset.brawlerImage
                    );


                const brawler =
                    list.find(
                        item =>
                            String(
                                item.id
                            ) === id
                    );


                const imageUrl =
                    brawler?.imageUrl ||
                    brawler?.imageUrl2 ||
                    brawler?.avatarUrl;


                if (imageUrl) {

                    image.src =
                        imageUrl;

                    image.style.display =
                        "block";

                } else {

                    image.style.display =
                        "none";

                    createBrawlerFallback(
                        image
                    );
                }


                image.onerror = () => {

                    image.style.display =
                        "none";

                    createBrawlerFallback(
                        image
                    );
                };
            }
        );

    } catch (error) {

        console.error(
            "Erreur images brawlers :",
            error
        );

        images.forEach(
            image => {

                image.style.display =
                    "none";

                createBrawlerFallback(
                    image
                );
            }
        );
    }
}


function createBrawlerFallback(image) {

    if (
        image.parentElement
            .querySelector(
                ".brawler-fallback"
            )
    ) {
        return;
    }


    const fallback =
        document.createElement(
            "div"
        );


    fallback.className =
        "brawler-fallback";


    fallback.textContent =
        "👊";


    image.parentElement.insertBefore(
        fallback,
        image
    );
}


// =========================================================
// UTILITAIRE TEXTE
// =========================================================

function setText(id, value) {

    const element =
        getElement(id);

    if (element) {

        element.textContent =
            value;
    }
}


// =========================================================
// ESCAPE HTML
// =========================================================

function escapeHtml(value) {

    return String(value)
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );
}


// =========================================================
// MISE À JOUR DES TROPHÉES
// =========================================================

async function updateTrophies() {

    const tag =
        getPlayerTag();


    if (!tag) {

        showToast(
            "Entre ton Player Tag."
        );

        return;
    }


    try {

        setLoading(true);


        const data =
            await getPlayerData(
                tag
            );


        savePlayerTag(
            data.tag ||
            tag
        );


        updateProfile(
            data
        );


        addHistoryPoint(
            Number(
                data.trophies
            ) || 0
        );


        updateHistoryStats();

        updateTrophyChart();

        showToast(
            `🏆 ${data.name} : ${formatNumber(data.trophies)} trophées`
        );


    } catch (error) {

        console.error(
            error
        );

        showToast(
            `❌ ${error.message}`
        );

    } finally {

        setLoading(false);
    }
}


// =========================================================
// INITIALISATION
// =========================================================

async function initializeApp() {

    const savedTag =
        loadPlayerTag();


    const challenge =
        getChallenge();


    if (challenge) {

        const targetInput =
            getElement("targetTrophies");

        const startInput =
            getElement("startDate");

        const endInput =
            getElement("endDate");


        if (targetInput) {

            targetInput.value =
                challenge.target;
        }


        if (startInput) {

            startInput.value =
                challenge.startDate;
        }


        if (endInput) {

            endInput.value =
                challenge.endDate;
        }


        displayChallenge(
            challenge
        );
    }


    updateHistoryStats();


    if (!savedTag) {
        return;
    }


    try {

        setLoading(true);


        const data =
            await getPlayerData(
                savedTag
            );


        updateProfile(
            data
        );


        addHistoryPoint(
            Number(
                data.trophies
            ) || 0
        );


        updateHistoryStats();


    } catch (error) {

        console.error(
            "Erreur initialisation :",
            error
        );

        showToast(
            "⚠️ Impossible de charger automatiquement le profil."
        );

    } finally {

        setLoading(false);
    }
}


// =========================================================
// NAVIGATION
// =========================================================

function setupNavigation() {

    const buttons =
        document.querySelectorAll(
            ".nav-button"
        );


    const sections =
        document.querySelectorAll(
            ".page-section"
        );


    buttons.forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    const target =
                        button.dataset.section;


                    buttons.forEach(
                        item =>
                            item.classList.remove(
                                "active"
                            )
                    );


                    sections.forEach(
                        section =>
                            section.classList.remove(
                                "active"
                            )
                    );


                    button.classList.add(
                        "active"
                    );


                    const targetSection =
                        getElement(
                            target
                        );


                    if (targetSection) {

                        targetSection.classList.add(
                            "active"
                        );
                    }
                }
            );
        }
    );
}


// =========================================================
// EVENTS
// =========================================================

function setupEvents() {

    const tagInput =
        getElement("playerTag");


    if (tagInput) {

        tagInput.addEventListener(
            "change",
            () => {

                const tag =
                    getPlayerTag();

                if (tag) {

                    savePlayerTag(
                        tag
                    );
                }
            }
        );


        tagInput.addEventListener(
            "keydown",
            event => {

                if (
                    event.key === "Enter"
                ) {

                    updateTrophies();
                }
            }
        );
    }


    const updateButton =
        getElement("updateButton");


    if (updateButton) {

        updateButton.addEventListener(
            "click",
            updateTrophies
        );
    }


    const calculateButton =
        getElement(
            "calculateChallengeButton"
        );


    if (calculateButton) {

        calculateButton.addEventListener(
            "click",
            calculateChallenge
        );
    }


    const search =
        getElement(
            "brawlerSearch"
        );


    if (search) {

        search.addEventListener(
            "input",
            renderBrawlers
        );
    }


    const sort =
        getElement(
            "brawlerSort"
        );


    if (sort) {

        sort.addEventListener(
            "change",
            renderBrawlers
        );
    }


    const clearHistory =
        getElement(
            "clearHistoryButton"
        );


    if (clearHistory) {

        clearHistory.addEventListener(
            "click",
            () => {

                const confirmation =
                    confirm(
                        "Voulez-vous vraiment effacer tout l'historique des trophées ?"
                    );


                if (!confirmation) {
                    return;
                }


                localStorage.removeItem(
                    HISTORY_KEY
                );


                updateHistoryStats();

                showToast(
                    "🗑️ Historique supprimé."
                );
            }
        );
    }
}


// =========================================================
// DOM READY
// =========================================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        setupNavigation();

        setupEvents();

        initializeApp();

    }
);