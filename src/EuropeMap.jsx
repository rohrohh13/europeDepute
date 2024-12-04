import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { MapContainer, TileLayer, GeoJSON, Marker, Popup, useMap } from "react-leaflet";
import MarkerClusterGroup from 'react-leaflet-cluster';
import { Star as StarIcon, Refresh as RefreshIcon, ChevronLeft as ChevronLeftIcon, ChevronRight as ChevronRightIcon, Language as LanguageIcon, Twitter as TwitterIcon, Facebook as FacebookIcon, Instagram as InstagramIcon } from '@mui/icons-material';
import { IconButton, Drawer, Box, Typography, Button } from "@mui/material";
import BookmarkIcon from "@mui/icons-material/Bookmark";
import BookmarkBorderIcon from "@mui/icons-material/BookmarkBorder";

import './EuropeMap.css';

const EuropeMap = () => {
  const [geoData, setGeoData] = useState(null);
  const [deputies, setDeputies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sheetData, setSheetData] = useState([]);
  const [countryCode, setCountryCode] = useState(null); // Pays sélectionné
  const [drawerOpen, setDrawerOpen] = useState(false); // Premier drawer
  const [deputyDrawerOpen, setDeputyDrawerOpen] = useState(false); // Deuxième drawer
  const [selectedDeputy, setSelectedDeputy] = useState(null); // Député sélectionné
  const [showDeputies, setShowDeputies] = useState(false);
  const [favoriteDeputies, setFavoriteDeputies] = useState([]); // Liste des favoris
  const [favoriteDrawerOpen, setFavoriteDrawerOpen] = useState(false); // Drawer pour les favoris
  const mapRef = useRef(null);

  // Charger le fichier GeoJSON des frontières européennes
  useEffect(() => {
    fetch("countries.geojson")
      .then((response) => response.json())
      .then((data) => setGeoData(data))
      .catch((error) => console.error("Erreur lors du chargement du GeoJSON :", error));
  }, []);

  // Charger les députés favoris à partir du cache
  useEffect(() => {
    const cachedFavorites = localStorage.getItem('favoriteDeputies');
    if (cachedFavorites) {
      setFavoriteDeputies(JSON.parse(cachedFavorites));
    }
  }, []);

  // Sauvegarder les députés favoris dans le cache
  useEffect(() => {
    if (favoriteDeputies.length > 0) {
      localStorage.setItem('favoriteDeputies', JSON.stringify(favoriteDeputies));
    }
  }, [favoriteDeputies]);

  // Ajouter un député aux favoris
  const addToFavorites = (deputy) => {
    if (!favoriteDeputies.some(fav => fav.id === deputy.id)) {
      setFavoriteDeputies([...favoriteDeputies, deputy]); // Ajouter à la liste
    }
  };
  const MapReference = () => {
    const map = useMap();
    useEffect(() => {
      mapRef.current = map;
    }, [map]);
    return null;
  };
  // Supprimer un député des favoris
  const removeFromFavorites = (deputy) => {
    setFavoriteDeputies(favoriteDeputies.filter(fav => fav.id !== deputy.id)); // Retirer de la liste
  };

  // Charger les données depuis Google Sheets via OpenSheet
  useEffect(() => {
    const cachedData = localStorage.getItem('sheetData');
    if (cachedData) {
      setSheetData(JSON.parse(cachedData));
      setLoading(false);
    } else {
      setLoading(true);
      const sheetId = "1EYCFXv26A4B1K_yLszsQswGTPbCzjPDa6JZQU8LuKkI"; // L'ID de ton Google Sheet
      const sheetName = "Feuille"; // Le nom de la feuille
      const url = `https://opensheet.elk.sh/${sheetId}/${sheetName}`;

      fetch(url)
        .then((response) => response.json())
        .then((data) => {
          setSheetData(data);
          localStorage.setItem('sheetData', JSON.stringify(data)); // Cache dans localStorage
          setLoading(false);
        })
        .catch((error) => {
          setError("Erreur de récupération des données.");
          setLoading(false);
        });
    }
  }, []);

  // Charger les députés à partir de l'API
  useEffect(() => {
    if (sheetData.length === 0) return;

    setLoading(true);
    setError(null);

    const params = new URLSearchParams({
      "country-of-representation": countryCode || "", // Filtrer par pays, ou tout inclure si aucun pays sélectionné
      format: "application/ld+json", // Demander une réponse en JSON-LD
    });

    fetch(`/api/api/v2/meps/show-current?${params}`, {
      method: "GET",
    })
      .then((response) => response.json())
      .then((data) => {
        if (data && data.data) {
          const deputiesFromAPI = data.data;

          // Enrichir les députés uniquement si sheetData est disponible
          const enrichedDeputies = deputiesFromAPI.map((deputy) => {
            const sheetDeputy = sheetData.find((sheetDeputy) =>
              String(sheetDeputy.mep_identifier).trim() === String(deputy.id.split("/")[1]).trim()
            );
            if (sheetDeputy) {
              return {
                ...deputy, // Les données de l'API
                ...sheetDeputy, // Les données du Google Sheet
              };
            }
            return deputy; // Si pas de correspondance, on garde juste les données de l'API
          });

          setDeputies(enrichedDeputies); // Stocker les députés enrichis
        }
        setLoading(false);
      })
      .catch((error) => {
        console.error("Erreur lors de la récupération des députés :", error);
        setError("Erreur de récupération des députés.");
        setLoading(false);
      });
  }, [sheetData, countryCode]);

  // Fonction pour zoomer sur un pays
  const zoomToCountry = useCallback((lat, lng, zoomLevel = 6) => {
    if (mapRef.current) {
      mapRef.current.setView([lat, lng], zoomLevel, { animate: true });
    }
  }, []);

  // Gérer le clic sur un pays
  const onEachFeature = (feature, layer) => {
    if (feature.properties && feature.properties.name) {
      layer.bindPopup(`<strong>${feature.properties.name}</strong>`);
      layer.on("click", () => {
        const selectedCountryCode = feature.properties.iso_a2; // ISO 3166-1 alpha-2 code
        const lat = feature.properties.lat; // Assure-toi que ton GeoJSON contient les coordonnées lat et lng
        const lng = feature.properties.lng;
  
        if (lat !== undefined && lng !== undefined) {
          setCountryCode(selectedCountryCode); // Mettre à jour le code pays sélectionné
          zoomToCountry(lat, lng);
          setDrawerOpen(true); // Ouvrir le premier drawer
  
          // Zoomer sur le pays
          
        } else {
          console.error('Les coordonnées du pays sont manquantes ou incorrectes.');
        }
      });
          // Ajouter les gestionnaires d'événements pour le survol
      // Ajouter les gestionnaires d'événements pour le survol
      layer.on({
        mouseover: () => {
          console.log('Mouse over:', feature.properties.name);
          layer.setStyle(hoverStyle);
        },
        mouseout: () => {
          console.log('Mouse out:', feature.properties.name);
          layer.setStyle(geoJsonStyle);
        },
      });
    }
  };

  const getPartyColor = (party) => {
    const partyColors = {
      "Groupe de l'Alliance Progressiste des Socialistes et Démocrates au Parlement européen": "#e60000", // Rouge
      "Groupe des Conservateurs et Réformistes européens": "#1d78d3", // Bleu
      "Le groupe de la gauche au Parlement européen - GUE/NGL": "#d84a38", // Orange
      "Groupe des Verts/Alliance libre européenne": "#73a700", // Vert
      "Groupe du Parti populaire européen (Démocrates-Chrétiens)": "#0056a0", // Bleu marine
      "Groupe Renew Europe": "#ffdc00", // Jaune
      "Groupe Patriotes pour l’Europe": "#d58e8e", // Rose
      "Non-inscrits": "#808080", // Gris
      "Groupe «L'Europe des nations souveraines» (ENS)": "#b5b5b5", // Gris clair
      "Groupe Patriotes pour l’Europe; Non-inscrits": "#b5b5b5", // Gris clair
      "Vides": "#a9a9a9" // Gris foncé
    };

    return partyColors[party] || "#a9a9a9"; // Couleur par défaut si aucun groupe n'est trouvé
  };

  const renderDeputyMarkers = () => {
    if (!showDeputies) return null; // Si la case n'est pas cochée, ne pas afficher les marqueurs

    // Filtrer les députés ayant des coordonnées valides
    const filteredDeputies = deputies.filter(
      (deputy) =>
        deputy.mep_place_of_birth_x &&
        deputy.mep_place_of_birth_y &&
        !isNaN(deputy.mep_place_of_birth_x) &&
        !isNaN(deputy.mep_place_of_birth_y)
    );

    return filteredDeputies.map((deputy, index) => {
      const lat = parseFloat(deputy.mep_place_of_birth_x);
      const lng = parseFloat(deputy.mep_place_of_birth_y);
      const party = deputy.mep_political_group || "Vides"; // Utiliser le bon champ ici, avec valeur par défaut "Vides" si non spécifié.

      // Obtenir la couleur correspondant au groupe politique
      const markerColor = getPartyColor(party);

      return (
        <Marker
          key={index}
          position={[lat, lng]}
          icon={L.divIcon({
            className: 'custom-marker', // Ajout d'une classe CSS personnalisée pour le style
            html: `<div style="background-color:${markerColor}; width: 20px; height: 20px; border-radius: 50%;"></div>`
          })}
          eventHandlers={{
            click: () => handleDeputyClick(deputy) // Ouvre le drawer au clic sur le marqueur
          }}
        >
          {/* Pas de Popup ici */}
        </Marker>
      );
    });
  };

  const calculateAge = (birthday) => {
    const birthDate = new Date(birthday);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();

    // Si l'anniversaire n'est pas encore passé cette année, soustraire 1 à l'âge
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    return age;
  };

  // Gérer le clic sur un député
  const handleDeputyClick = (deputy) => {
    setSelectedDeputy(deputy); // Député sélectionné
    setDeputyDrawerOpen(true); // Ouvrir le deuxième drawer
  };

  let deputiesCache = null;

  const groupDeputiesByPoliticalGroup = (deputies) => {
    if (!deputiesCache) {
      deputiesCache = deputies.reduce((acc, deputy) => {
        const group = deputy.mep_political_group_acro || "Vides";
        if (!acc[group]) {
          acc[group] = [];
        }
        acc[group].push(deputy);
        return acc;
      }, {});
    }
    return deputiesCache;
  };
  const geoJsonStyle = {
    fillColor: "#003399",
    color: "#003399", // Couleur des contours
    weight: 1, // Épaisseur des contours
    fillOpacity: 0.2, // Opacité de remplissage
  };
  const hoverStyle = {
    fillColor: "#FFCC00", // Couleur de remplissage au survol
    fillOpacity: 0.3, // Opacité de remplissage au survol
  };

  const countryNames = {
    AT: "autrichiens",   // Autriche
    BE: "belges",        // Belgique
    BG: "bulgares",      // Bulgarie
    HR: "croates",       // Croatie
    CY: "chypriotes",    // Chypre
    CZ: "tchèques",      // République tchèque
    DK: "danois",        // Danemark
    EE: "estonien",      // Estonie
    FI: "finlandais",    // Finlande
    FR: "français",      // France
    DE: "allemands",     // Allemagne
    GR: "grecs",         // Grèce
    HU: "hongrois",      // Hongrie
    IE: "irlandais",     // Irlande
    IT: "italiens",      // Italie
    LV: "lettons",       // Lettonie
    LT: "lituaniens",    // Lituanie
    LU: "luxembourgeois",// Luxembourg
    MT: "maltais",       // Malte
    NL: "néerlandais",   // Pays-Bas
    PL: "polonais",      // Pologne
    PT: "portugais",     // Portugal
    RO: "roumains",      // Roumanie
    SK: "slovaques",     // Slovaquie
    SI: "slovènes",      // Slovénie
    ES: "espagnols",     // Espagne
    SE: "suédois",       // Suède
  };

  const groupedDeputies = useMemo(() => {
    if (!deputies || deputies.length === 0) return {};
  
    return countryCode
      ? groupDeputiesByPoliticalGroup(deputies.filter(deputy => deputy["api:country-of-representation"] === countryCode))
      : groupDeputiesByPoliticalGroup(deputies);
  }, [deputies, countryCode]);
  
  
  return (
    <div>
      <Box sx={{ padding: 2 }}>
        <label>
          <input
            type="checkbox"
            checked={showDeputies}
            onChange={() => setShowDeputies(!showDeputies)} // Inverse l'état de la case à cocher
          />
          Afficher les députés
        </label>
      </Box>
      {/* Carte */}
      <MapContainer
        className="map-container"
        center={[54, 15]} // Coordonnées centrales (Europe)
        zoom={4} // Zoom initial
        whenCreated={(map) => {
          mapRef.current = map;
          console.log("Map reference obtained:", mapRef.current);
        }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        {geoData && <GeoJSON data={geoData} onEachFeature={onEachFeature} style={geoJsonStyle} />}

        <MarkerClusterGroup>{renderDeputyMarkers()}</MarkerClusterGroup>
        <MapReference />
      </MapContainer>

      {loading && <p>Chargement des députés...</p>}
      {error && <p>{error}</p>}

      {/* Premier Drawer : Liste des députés par groupe politique */}
      <Drawer anchor="left" open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <Box sx={{ padding: 2, width: 400 }}>
          <Typography variant="h6" style={{
            fontSize: '22px',
            fontWeight: 600,
            color: '#333',
            textAlign: 'center',
            marginBottom: '20px',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            backgroundColor: '#f4f4f4',
            padding: '12px',
            borderRadius: '8px',
            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
            fontFamily: '"IBM Plex Sans", sans-serif',
          }}>
            Députés {countryCode ? `${countryNames[countryCode] || 'européens'}` : "européens"}
          </Typography>
          {Object.keys(groupedDeputies).map((group, index) => (
            <div key={index}>
              <Typography variant="body1" style={{
                fontSize: '18px',
                fontWeight: 500, // Poids de police modéré
                color: '#4a4a4a', // Couleur plus douce et subtile
                letterSpacing: '0.5px', // Espacement des lettres pour un effet plus léger
                marginBottom: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between', // Pour aligner les éléments à gauche et droite
                backgroundColor: '#f8f8f8', // Fond très léger
                padding: '8px 12px',
                borderRadius: '8px', // Coins arrondis pour un look plus moderne
                boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)', // Ombre subtile pour plus de profondeur
                cursor: 'default' // Empêche le curseur de changer lors du survol
              }}
              >
                <strong style={{ fontSize: '20px', fontWeight: 600, color: '#1e88e5' }}>
                  {group}
                </strong>
                <span style={{ fontSize: '14px', color: '#888' }}>
                  ({groupedDeputies[group].length} députés)
                </span>
              </Typography>
              <div>
                {groupedDeputies[group].map((deputy, deputyIndex) => (
                  <div
                    key={deputyIndex}
                    onClick={() => handleDeputyClick(deputy)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between', // Aligne le texte et le chevron
                      marginBottom: '15px',
                      padding: '10px',
                      borderRadius: '10px',
                      backgroundColor: '#f5f5f5',
                      boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease-in-out',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'scale(1.02)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <img
                        src={deputy.mep_image || 'default-image-url.jpg'}
                        alt={`${deputy.givenName} ${deputy.familyName}`}
                        style={{
                          width: '45px',
                          height: '45px',
                          borderRadius: '50%',
                          objectFit: 'contain',
                          marginRight: '15px',
                          transition: 'transform 0.3s ease',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'scale(1.1)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'scale(1)';
                        }}
                      />
                      <p style={{ margin: '0', fontWeight: 'bold', fontSize: '16px', color: '#333' }}>
                        {deputy.givenName} {deputy.familyName}
                      </p>
                    </div>

                    <ChevronRightIcon
                      style={{
                        fontSize: '24px', // Taille de l'icône
                        color: '#888',
                        transition: 'transform 0.3s ease', // Animation du chevron
                      }}
                    />
                  </div>
                ))}
              </div>

            </div>
          ))}
        </Box>
      </Drawer>
      {/* Deuxième Drawer : Détails du député */}
      <Drawer anchor="left" open={deputyDrawerOpen} onClose={() => setDeputyDrawerOpen(false)}>
        <Box sx={{ padding: 3, width: 400, backgroundColor: "#f9f9f9" }}>
          {/* Bouton de fermeture avec chevron gauche */}
          <Button
            onClick={() => setDeputyDrawerOpen(false)}
            sx={{
              display: "flex",
              alignItems: "center",
              marginBottom: 3,
              color: "#555",
              fontWeight: "bold",
              textTransform: "none",
            }}
          >
            <ChevronLeftIcon sx={{ marginRight: 1, fontSize: 24 }} />
            Retour
          </Button>

          {selectedDeputy ? (
            <>
              {/* Nom du député */}
              <Typography variant="h5" sx={{ fontWeight: "bold", marginBottom: 2 }}>
                {selectedDeputy.givenName} {selectedDeputy.familyName}
              </Typography>

              {/* Informations générales */}
              <Typography sx={{ marginBottom: 1, fontSize: "16px", color: "#333" }}>
                <strong>Groupe Politique :</strong> {selectedDeputy.mep_political_group_acro || "Non spécifié"}
              </Typography>
              <Typography sx={{ marginBottom: 1, fontSize: "16px", color: "#333" }}>
                <strong>Pays de Représentation :</strong> {selectedDeputy.mep_country_of_representation}
              </Typography>
              <Typography sx={{ marginBottom: 1, fontSize: "16px", color: "#333" }}>
                <strong>Âge :</strong> {selectedDeputy.mep_birthday ? calculateAge(selectedDeputy.mep_birthday) : "Non spécifié"}
              </Typography>
              <Typography sx={{ marginBottom: 1, fontSize: "16px", color: "#333" }}>
                <strong>Email :</strong> {selectedDeputy.mep_email || "Non disponible"}
              </Typography>
              <Typography sx={{ marginBottom: 2, fontSize: "16px", color: "#333" }}>
                <strong>Lieu de naissance :</strong> {selectedDeputy.mep_place_of_birth || "Non disponible"}
              </Typography>

              {/* Image */}
              {selectedDeputy.mep_image && (
                <img
                  src={selectedDeputy.mep_image}
                  alt={`${selectedDeputy.givenName} ${selectedDeputy.familyName}`}
                  style={{
                    width: "100%",
                    borderRadius: "10px",
                    margin: "15px 0",
                    boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
                  }}
                />
              )}
              <Button
                onClick={() =>
                  favoriteDeputies.some((fav) => fav.id === selectedDeputy.id)
                    ? removeFromFavorites(selectedDeputy)
                    : addToFavorites(selectedDeputy)
                }
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  marginTop: 2,
                  padding: 1,
                  backgroundColor: "#e0f7fa",
                  color: "#00796b",
                  "&:hover": {
                    backgroundColor: "#b2ebf2",
                  },
                }}
              >
                {favoriteDeputies.some((fav) => fav.id === selectedDeputy.id) ? (
                  <BookmarkIcon />
                ) : (
                  <BookmarkBorderIcon />
                )}
                {favoriteDeputies.some((fav) => fav.id === selectedDeputy.id)
                  ? "Retirer des favoris"
                  : "Ajouter aux favoris"}
              </Button>
              {/* Réseaux sociaux */}
              {(selectedDeputy.mep_homepage || selectedDeputy.mep_twitter || selectedDeputy.mep_facebook_page || selectedDeputy.mep_instagram) && (
                <>
                  <Typography variant="h6" sx={{ marginTop: 2, marginBottom: 1, color: "#444" }}>
                    Réseaux sociaux :
                  </Typography>
                  <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", justifyContent: "flex-start" }}>
                    {selectedDeputy.mep_homepage && (
                      <a href={selectedDeputy.mep_homepage} target="_blank" rel="noopener noreferrer">
                        <IconButton color="primary" size="large" aria-label="Site personnel">
                          <LanguageIcon />
                        </IconButton>
                      </a>
                    )}
                    {selectedDeputy.mep_twitter && (
                      <a href={selectedDeputy.mep_twitter} target="_blank" rel="noopener noreferrer">
                        <IconButton color="info" size="large" aria-label="Twitter">
                          <TwitterIcon />
                        </IconButton>
                      </a>
                    )}
                    {selectedDeputy.mep_facebook_page && (
                      <a href={selectedDeputy.mep_facebook_page} target="_blank" rel="noopener noreferrer">
                        <IconButton color="primary" size="large" aria-label="Facebook">
                          <FacebookIcon />
                        </IconButton>
                      </a>
                    )}
                    {selectedDeputy.mep_instagram && (
                      <a href={selectedDeputy.mep_instagram} target="_blank" rel="noopener noreferrer">
                        <IconButton color="secondary" size="large" aria-label="Instagram">
                          <InstagramIcon />
                        </IconButton>
                      </a>
                    )}
                  </Box>
                </>
              )}
            </>
          ) : (
            <Typography>Aucun député sélectionné.</Typography>
          )}
        </Box>
      </Drawer>
      {/* Drawer des favoris */}
      <Drawer anchor="right" open={favoriteDrawerOpen} onClose={() => setFavoriteDrawerOpen(false)}>
        <Box sx={{ padding: 2, width: 400 }}>
          <Typography variant="h6">Mes favoris</Typography>
          {favoriteDeputies.length === 0 ? (
            <Typography>Aucun favori sélectionné.</Typography>
          ) : (
            <div>
              {favoriteDeputies.map((deputy, index) => (
                <div
                  key={index}
                  onClick={() => handleDeputyClick(deputy)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '15px',
                    padding: '10px',
                    borderRadius: '10px',
                    backgroundColor: '#f5f5f5',
                    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease-in-out',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.02)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <img
                      src={deputy.mep_image || 'default-image-url.jpg'}
                      alt={`${deputy.givenName} ${deputy.familyName}`}
                      style={{
                        width: '45px',
                        height: '45px',
                        borderRadius: '50%',
                        objectFit: 'contain',
                        marginRight: '15px',
                        transition: 'transform 0.3s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'scale(1.1)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'scale(1)';
                      }}
                    />
                    <p style={{ margin: '0', fontWeight: 'bold', fontSize: '16px', color: '#333' }}>
                      {deputy.givenName} {deputy.familyName}
                    </p>
                  </div>

                  <ChevronRightIcon
                    style={{
                      fontSize: '24px',
                      color: '#888',
                      transition: 'transform 0.3s ease',
                    }}
                  />
                </div>
              ))}
            </div>
          )}
        </Box>
      </Drawer>

      <IconButton onClick={() => setFavoriteDrawerOpen(true)} style={{ position: "fixed", top: "20px", right: "20px" }}>
        <StarIcon fontSize="large" />
      </IconButton>
    </div>
  );
};

export default EuropeMap;
