import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { MapContainer, TileLayer, GeoJSON, Marker, Popup, useMap } from "react-leaflet";
import MarkerClusterGroup from 'react-leaflet-cluster';
import { Star as StarIcon, Refresh as RefreshIcon, ChevronRight as ChevronRightIcon, Language as LanguageIcon, Twitter as TwitterIcon, Facebook as FacebookIcon, Instagram as InstagramIcon } from '@mui/icons-material';
import { IconButton, Drawer, Box, Typography, Button } from "@mui/material";
import BookmarkIcon from "@mui/icons-material/Bookmark";
import BookmarkBorderIcon from "@mui/icons-material/BookmarkBorder";
import CloseIcon from '@mui/icons-material/Close';
import MailIcon from "@mui/icons-material/Mail";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
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

  // Charger les députés à partir des données de Google Sheets
  useEffect(() => {
    if (sheetData.length === 0) return;

    setLoading(true);
    setError(null);

    const deputiesFromSheet = sheetData.map((deputy) => ({
      id: deputy.mep_identifier,
      givenName: deputy.mep_given_name,
      familyName: deputy.mep_family_name,
      mep_political_group: deputy.mep_political_group,
      mep_political_group_acro: deputy.mep_political_group_acro,
      mep_place_of_birth: deputy.mep_place_of_birth,
      mep_place_of_birth_x: deputy.mep_place_of_birth_x,
      mep_place_of_birth_y: deputy.mep_place_of_birth_y,
      mep_email_without: deputy.mep_email_without,
      mep_birthday: deputy.mep_birthday,
      mep_email: deputy.mep_email,
      mep_image: deputy.mep_image,
      mep_homepage: deputy.mep_homepage,
      mep_twitter: deputy.mep_twitter,
      mep_facebook_page: deputy.mep_facebook_page,
      mep_instagram: deputy.mep_instagram,
      mep_country_of_representation: deputy.mep_country_of_representation,
      mep_citizenship: deputy.mep_citizenship,
      mep_gender: deputy.mep_gender,
    }));

    setDeputies(deputiesFromSheet); // Stocker les députés enrichis
    setLoading(false);
  }, [sheetData]);

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
        const lat = feature.properties.lat; // Assurez-vous que votre GeoJSON contient les coordonnées lat et lng
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
    fillColor: "#9747FF",
    color: "#9747FF", // Couleur des contours
    weight: 1, // Épaisseur des contours
    fillOpacity: 0.2, // Opacité de remplissage
  };
  const hoverStyle = {
    fillColor: "#9747FF", // Couleur de remplissage au survol
    fillOpacity: 0.4, // Opacité de remplissage au survol
  };
  

  const countryNames = {
    AT: "Autriche",   // Autriche
    BE: "Belgique",        // Belgique
    BG: "Bulgarie",      // Bulgarie
    HR: "Croatie",       // Croatie
    CY: "Chypre",    // Chypre
    CZ: "Tchéquie",      // République tchèque
    DK: "Danemark",        // Danemark
    EE: "Estonie",      // Estonie
    FI: "Finlande",    // Finlande
    FR: "France",      // France
    DE: "Allemagne",     // Allemagne
    GR: "Grèce",         // Grèce
    HU: "Hongrie",      // Hongrie
    IE: "Irlande",     // Irlande
    IT: "Italie",      // Italie
    LV: "Lettonie",       // Lettonie
    LT: "Lituanie",    // Lituanie
    LU: "Luxembourg",// Luxembourg
    MT: "Malte",       // Malte
    NL: "Pays-Bas",   // Pays-Bas
    PL: "Pologne",      // Pologne
    PT: "Portugal",     // Portugal
    RO: "Roumanie",      // Roumanie
    SK: "Slovaquie",     // Slovaquie
    SI: "Slovénie",      // Slovénie
    ES: "Espagne",     // Espagne
    SE: "Suède",       // Suède
  };


  const groupedDeputies = useMemo(() => {
    if (!deputies || deputies.length === 0) return {};

    const filteredDeputies = countryCode
      ? deputies.filter(deputy => deputy.mep_country_of_representation === countryCode)
      : deputies;

    return groupDeputiesByPoliticalGroup(filteredDeputies);
  }, [deputies, countryCode]);

  const calculateFemalePercentage = (groupedDeputies) => {
    const totalDeputies = Object.values(groupedDeputies).reduce((sum, group) => sum + group.length, 0);
    const femaleDeputies = Object.values(groupedDeputies).flat().filter(deputy => deputy.mep_gender === 'féminin').length;
    console.log('Total deputies:', totalDeputies);
    console.log('Female deputies:', femaleDeputies);
    return totalDeputies > 0 ? ((femaleDeputies / totalDeputies) * 100).toFixed(0) : 0;
  };

  const calculateAverageAgeForCountry = (deputies, countryCode) => {
    const filteredDeputies = deputies.filter(deputy => deputy.mep_country_of_representation === countryCode);
    const totalAge = filteredDeputies.reduce((sum, deputy) => {
      const age = calculateAge(deputy.mep_birthday);
      return sum + age;
    }, 0);
    return filteredDeputies.length > 0 ? (totalAge / filteredDeputies.length).toFixed(0) : 0;
  };
  return (
    <div>

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

        <MarkerClusterGroup
          showCoverageOnHover={false} // Désactiver le polygone autour du cluster
        >
        {renderDeputyMarkers()}
        </MarkerClusterGroup>
        <MapReference />
      </MapContainer>
      <div className="footer">
        <div className="footerUn">
          <span>Version Beta</span>
        </div>
        <div className="footerDeux">
          <span>La carto</span>
          <a href="https://datack.fr" target="_blank">
            <img src="/logo-datack.png"/>
          </a>
          <span>CIBLER, trier ET RÉCUPÉRER vos contacts</span>
        </div>
      </div>
      {loading && <p>Chargement des députés...</p>}
      {error && <p>{error}</p>}

      {/* Premier Drawer : Liste des députés par groupe politique */}
      <Drawer anchor="left" open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <Box sx={{ width: 355 }}>
          <div className="headerDerawerUn">
            <IconButton
              edge="start"
              color="inherit"
              aria-label="close"
              onClick={() => setDrawerOpen(false)}
              sx={{ position: 'absolute', right: 20, top: 20 }}
            >
              <CloseIcon />
            </IconButton>


            <h2>{countryCode ? `${countryNames[countryCode] || 'européens'}` : "européens"}</h2>
            <p>{Object.values(groupedDeputies).reduce((sum, group) => sum + group.length, 0)} députés</p>
            <p>Part des femmes : {calculateFemalePercentage(groupedDeputies)}%</p>
            <p>Âge moyen des députés : {calculateAverageAgeForCountry(deputies, countryCode)} ans</p>
          </div>
            
          <div className="bottomDerawerUn">
            {Object.keys(groupedDeputies).map((group, index) => (          
                <div key={index}>
                    <div className="drawerUnGroupeInfo">
                      <h3>{group}</h3>
                      <span>({groupedDeputies[group].length} députés)</span>
                    </div>
                  <div>
                    {groupedDeputies[group].map((deputy, deputyIndex) => (
                      <div
                        key={deputyIndex}
                        className="drawerUnGroupeBlocDepute"
                        onClick={() => handleDeputyClick(deputy)}
                      >
                        <div className="drawerUnGroupeBlocDeputeFlex">
                          <img
                            src={deputy.mep_image || 'default-image-url.jpg'}
                            alt={`${deputy.givenName} ${deputy.familyName}`}
                          />
                          <div>
                            <h4>{deputy.givenName} {deputy.familyName}</h4>
                            <p>{deputy.mep_birthday ? calculateAge(deputy.mep_birthday) : "Non spécifié"} ans</p>
                          </div>   
                          <ChevronRightIcon
                            style={{
                              fontSize: '24px', // Taille de l'icône
                              color: '#000000',
                              transition: 'transform 0.3s ease', 
                              width: '14px',
                              height: '14px',
                              position: 'absolute',
                              right: '17px'
                            }}
                          />                       
                        </div>
                      </div>
                    ))}
                  </div>

                </div>

            ))}
          </div>
        </Box>
      </Drawer>
      {/* Deuxième Drawer : Détails du député */}
      <Drawer anchor="left" open={deputyDrawerOpen} onClose={() => setDeputyDrawerOpen(false)}>
        <Box sx={{ width: 350, backgroundColor: "#ffffff" }}>
          {/* Bouton de fermeture avec chevron gauche */}
          <IconButton
              edge="start"
              color="inherit"
              aria-label="close"
              onClick={() => setDeputyDrawerOpen(false)}
              sx={{ position: 'absolute', left: 20, top: 20 }}
            >
              <ChevronLeftIcon />
          </IconButton>
          <IconButton
              edge="start"
              color="inherit"
              aria-label="close"
              onClick={() => setDeputyDrawerOpen(false)}
              sx={{ position: 'absolute', right: 20, top: 20 }}
            >
              <CloseIcon />
          </IconButton>
          {selectedDeputy ? (
            <>
              {/* Image */}
              {selectedDeputy.mep_image && (
                <img
                  src={selectedDeputy.mep_image}
                  alt={`${selectedDeputy.givenName} ${selectedDeputy.familyName}`}
                  style={{
                    width: "100%",
                    margin: "0",
                    boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
                  }}
                />
              )}
              {/* Nom du député */}
              <div className="headerDeputeSelect">
                <p>{selectedDeputy.mep_citizenship}</p>
                <h2>
                  {selectedDeputy.givenName} {selectedDeputy.familyName}
                </h2>
              </div>
              <Button
                onClick={() =>
                  favoriteDeputies.some((fav) => fav.id === selectedDeputy.id)
                    ? removeFromFavorites(selectedDeputy)
                    : addToFavorites(selectedDeputy)
                }
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: 'space-between',
                  padding: '11px 20px',
                  width: '100%',
                  color: "#9747FF",
                  "&:hover": {
                    backgroundColor: "rgba(28, 28, 28, 0.08)",
                  },
                }}
              >
                {favoriteDeputies.some((fav) => fav.id === selectedDeputy.id)
                  ? "Retirer cette fiche des favoris"
                  : "Ajouter cette fiche aux favoris"}
                {favoriteDeputies.some((fav) => fav.id === selectedDeputy.id) ? (
                  <BookmarkIcon />
                ) : (
                  <BookmarkBorderIcon />
                )}
              </Button>
              {/* Informations générales */}
              <div className="lesInfosDuDepute">
                <p>Groupe Politique <span>{selectedDeputy.mep_political_group_acro || "Non spécifié"}</span></p>
                <p>Pays de Représentation <span>{selectedDeputy.mep_citizenship}</span></p>
                <p>Âge <span>{selectedDeputy.mep_birthday ? calculateAge(selectedDeputy.mep_birthday) : "Non spécifié"} ans</span></p>
                <p>Lieu de naissance <span>{selectedDeputy.mep_place_of_birth || "Non disponible"}</span></p>
              </div>
              {/* Réseaux sociaux */}
              {(selectedDeputy.mep_homepage || selectedDeputy.mep_twitter || selectedDeputy.mep_facebook_page || selectedDeputy.mep_instagram || selectedDeputy.mep_email) && (
                <>
                  <div className="lesInfosDuDeputeRS">
                    <h3>Contacter {selectedDeputy.givenName} {selectedDeputy.familyName}</h3>
                    <Box>
                      {selectedDeputy.mep_homepage && (
                        <a href={selectedDeputy.mep_homepage} target="_blank" rel="noopener noreferrer">
                          <IconButton color="#979797" size="large" aria-label="Site personnel">
                            <LanguageIcon />
                          </IconButton>
                        </a>
                      )}
                      {selectedDeputy.mep_twitter && (
                        <a href={selectedDeputy.mep_twitter} target="_blank" rel="noopener noreferrer">
                          <IconButton color="#979797" size="large" aria-label="Twitter">
                            <TwitterIcon />
                          </IconButton>
                        </a>
                      )}
                      {selectedDeputy.mep_facebook_page && (
                        <a href={selectedDeputy.mep_facebook_page} target="_blank" rel="noopener noreferrer">
                          <IconButton color="#979797" size="large" aria-label="Facebook">
                            <FacebookIcon />
                          </IconButton>
                        </a>
                      )}
                      {selectedDeputy.mep_instagram && (
                        <a href={selectedDeputy.mep_instagram} target="_blank" rel="noopener noreferrer">
                          <IconButton color="#979797" size="large" aria-label="Instagram">
                            <InstagramIcon />
                          </IconButton>
                        </a>
                      )}
                    </Box>
                    {selectedDeputy.mep_email && (
                      <div className="blocMailDepute"> 
                        <a href={selectedDeputy.mep_email} target="_blank" rel="noopener noreferrer">
                          <IconButton>
                            <MailIcon />
                          </IconButton>
                        </a>
                        <p>{selectedDeputy.mep_email_without}</p>
                      </div>
                    )}
                  </div>
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
        <div className="drawerTrois">
          <Box sx={{ width: 350 }}>
          <IconButton
              edge="start"
              color="inherit"
              aria-label="close"
              onClick={() => setFavoriteDrawerOpen(false)}
              sx={{ position: 'absolute', right: 20, top: 12, zIndex:'999', color:'#ffffff' }}
            >
              <CloseIcon />
            </IconButton>
            <div className="headerDrawerFavori">
              <BookmarkIcon sx={{ color:'#ffffff' }} />
              <p>Favoris</p>
            </div>
            {favoriteDeputies.length === 0 ? (
              <p className="noFav">Aucun favori sélectionné.</p>
            ) : (
              <div className="drawerTroisFav">
                {favoriteDeputies.map((deputy, index) => (
                  <div
                    key={index}
                    className="drawerUnGroupeBlocDepute"
                    onClick={() => handleDeputyClick(deputy)}
                  >
                        <div className="drawerUnGroupeBlocDeputeFlex">
                          <img
                            src={deputy.mep_image || 'default-image-url.jpg'}
                            alt={`${deputy.givenName} ${deputy.familyName}`}
                          />
                          <div>
                            <h4>{deputy.givenName} {deputy.familyName}</h4>
                            <p>{deputy.mep_birthday ? calculateAge(deputy.mep_birthday) : "Non spécifié"} ans</p>
                          </div>   
                          <ChevronRightIcon
                            style={{
                              fontSize: '24px', // Taille de l'icône
                              color: '#000000',
                              transition: 'transform 0.3s ease', 
                              width: '14px',
                              height: '14px',
                              position: 'absolute',
                              right: '17px'
                            }}
                          />                       
                        </div>


                  </div>
                ))}
              </div>
            )}
          </Box>
        </div>
      </Drawer>

      <IconButton className="buttonFavorite" onClick={() => setFavoriteDrawerOpen(true)} style={{ position: "fixed", top: "16px", right: "28px", zIndex:1000,background:"#fff",borderRadius:'8px',color:'#9747FF'}}>
        <BookmarkIcon/>
      </IconButton>
      <Box sx={{ position: "fixed", top: "16px", right: "80px", zIndex:1000,background:"#fff",borderRadius:'8px',color:'#9747FF',padding: '8px', }}>
        <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={showDeputies}
            onChange={() => setShowDeputies(!showDeputies)} // Inverse l'état de la case à cocher
            style={{ display: 'none' }} // Cache l'input pour un rendu plus propre
          />
          {showDeputies ? (
            <VisibilityIcon sx={{ color: "rgb(151, 71, 255)" }} />
          ) : (
            <VisibilityOffIcon sx={{ color: "gray" }} />
          )}
        </label>
      </Box>


    </div>
  );
};

export default EuropeMap;
