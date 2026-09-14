// ============================================
// BRAWL TRACKER - SERVEUR
// ============================================

// Charger les variables du fichier .env
require("dotenv").config();


// Importer les modules
const express = require("express");
const path = require("path");


// Créer le serveur
const app = express();


// Port du serveur
const PORT = process.env.PORT || 3000;


// Permettre de recevoir du JSON
app.use(express.json());


// ============================================
// AFFICHER LE SITE
// ============================================

// Le dossier principal "Brawl Tracker"
// contient index.html, style.css et script.js
app.use(express.static(path.join(__dirname, "..")));


// ============================================
// API BRAWL STARS
// ============================================

app.get("/api/player/:tag", async (req, res) => {

    try {

        // Récupérer le Player Tag
        const tag = req.params.tag.toUpperCase();

        console.log("");
        console.log("📡 Demande reçue pour :", tag);


        // Vérifier que la clé API existe
        if (!process.env.BRAWL_API_KEY) {

            console.error("❌ Clé API Brawl Stars introuvable.");

            return res.status(500).json({
                error: "La clé API Brawl Stars est absente du fichier .env."
            });
        }


        // Appel à l'API officielle Brawl Stars
        const response = await fetch(
            `https://api.brawlstars.com/v1/players/${encodeURIComponent(tag)}`,
            {
                method: "GET",

                headers: {
                    "Authorization":
                        `Bearer ${process.env.BRAWL_API_KEY}`,

                    "Accept": "application/json"
                }
            }
        );


        // Récupérer la réponse JSON
        const data = await response.json();


        // Si l'API renvoie une erreur
        if (!response.ok) {

            console.error(
                "❌ Erreur API Brawl Stars :",
                data
            );

            return res.status(response.status).json({
                error: data
            });
        }


        // Joueur trouvé
        console.log(
            "✅ Joueur récupéré :",
            data.name
        );

        console.log(
            "🏆 Trophées :",
            data.trophies
        );


        // Envoyer les données au site
        res.json(data);


    } catch (error) {

        console.error("");
        console.error("❌ ERREUR SERVEUR :");
        console.error(error);


        res.status(500).json({
            error:
                "Erreur lors de la connexion à l'API Brawl Stars."
        });
    }

});


// ============================================
// LANCEMENT DU SERVEUR
// ============================================

app.listen(PORT, "0.0.0.0", () => {

    console.log("");
    console.log("====================================");
    console.log("🚀 BRAWL TRACKER SERVEUR");
    console.log("====================================");
    console.log("");

    console.log(
        `🌐 Site : http://localhost:${PORT}`
    );

    console.log(
        `📡 API  : http://localhost:${PORT}/api/player/...`
    );

    console.log("");

    console.log("====================================");
    console.log("✅ Serveur prêt !");
    console.log("====================================");
    console.log("");

});