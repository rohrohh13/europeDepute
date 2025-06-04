// @ts-ignore
import { useState } from 'react';
// @ts-ignore
import {
  Dialog,
  DialogContent,
  IconButton,
  Box,
  Typography,
} from '@mui/material';
// @ts-ignore
import { Swiper, SwiperSlide } from 'swiper/react';
// @ts-ignore
import { Navigation, Pagination } from 'swiper/modules';
// @ts-ignore
import 'swiper/css';
// @ts-ignore
import 'swiper/css/navigation';
// @ts-ignore
import 'swiper/css/pagination';
// @ts-ignore
import type { Swiper as SwiperType } from 'swiper';

// Styles CSS pour Swiper
const styles = `
  .swiper-pagination-bullet {
    width: 23px;
    height: 2px;
    background: rgba(255, 255, 255, 0.5);
    opacity: 1;
    margin: 0 5px;
    border-radius: 1px;
  }
  .swiper-pagination-bullet-active {
    background: white;
    width: 23px;
    height: 2px;
    border-radius: 1px;
  }
  .swiper-button-next,
  .swiper-button-prev {
    width: 23px !important;
    height: 23px !important;
    background-repeat: no-repeat !important;
    background-position: center !important;
    background-size: contain !important;
    cursor: pointer !important;
  }
  .swiper-button-disabled {
    opacity: 0.35 !important;
    cursor: pointer !important;
    pointer-events: auto !important;
  }
  .swiper-button-next {
    right: 20px !important;
    background-image: url("data:image/svg+xml,%3Csvg width='23' height='23' viewBox='0 0 23 23' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M8.625 4.3125L15.8125 11.5L8.625 18.6875' stroke='white' stroke-width='1.07813' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E") !important;
  }
  .swiper-button-prev {
    left: 20px !important;
    background-image: url("data:image/svg+xml,%3Csvg width='23' height='23' viewBox='0 0 23 23' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M14.375 18.6875L7.1875 11.5L14.375 4.3125' stroke='white' stroke-width='1.07813' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E") !important;
  }
  .swiper-button-next::after,
  .swiper-button-prev::after {
    display: none;
  }
`;

// Ajout des styles au document
const styleSheet = document.createElement("style");
styleSheet.innerText = styles;
document.head.appendChild(styleSheet);

interface WelcomePopupProps {
  open: boolean;
  onClose: () => void;
}

const WelcomePopup = ({ open, onClose }: WelcomePopupProps) => {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  const handleSlideChange = (swiper: SwiperType) => {
    setCurrentSlideIndex(swiper.activeIndex);
  };

  const slides = [
    {
      logo: '/logo-datack-map.png',
      title: 'Un outil de visualisation de données pour votre organisation',
      content: '',
      image: '/datack-outil-visualisation.png',
    },
    {
      logo: '/logo-datack-map.png',
      title: 'Affichez vos groupes locaux, événements, actions, élus, prospects...',
      content: '',
      image: '/datack-outil-cartographie-donnes.png',
    },
    {
      logo: '/logo-datack-map.png',
      title: '...et transformez vos données statiques en informations dynamiques',
      content: '',
      image: '/datack-outil-statistiques.png',
    },
    {
      logo: '/logo-datack-map.png',
      title: (
        <>
          L'agence{' '}
          <Box
            component="a"
            href="https://datack.fr"
            target="_blank"
            rel="noopener noreferrer"
            sx={{
              color: '#DBFF3B',
              textDecoration: 'underline',
              '&:hover': {
                textDecoration: 'none',
                color: '#DBFF3B',
              },
            }}
          >
            Datack
          </Box>{' '}
          est spécialisée dans les stratégies de mobilisation et d'engagement des publics
        </>
      ),
      content: '',
      image: '/datack-c-est-la-cible.png',
    },
  ];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={false}
      PaperProps={{
        sx: {
          borderRadius: '30px',
          position: 'relative',
          overflow: 'hidden',
          zIndex: 9999,
          width: '610px',
          height: '520px',
          maxWidth: '610px',
          maxHeight: '520px',
        },
      }}
      sx={{
        zIndex: 9999,
        '& .MuiBackdrop-root': {
          backgroundColor: 'rgba(10, 10, 10, 0.90)',
        },
      }}
    >
      <IconButton
        onClick={onClose}
        sx={{
          position: 'absolute',
          right: 16,
          top: 16,
          zIndex: 10000,
          width: '20px',
          height: '20px',
          padding: 0,
          '&:hover': {
            opacity: 0.9,
          },
        }}
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="10" cy="10" r="10" fill="white"/>
          <path d="M15 5L5 15" stroke="#0A0A0A" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M15 15L5 5" stroke="#0A0A0A" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </IconButton>

      <DialogContent sx={{ p: 0, overflow: 'hidden', zIndex: 9999 }}>
        <Swiper
          modules={[Navigation, Pagination]}
          navigation
          pagination={{ 
            clickable: true,
            renderBullet: function (_index: number, className: string) {
              return '<span class="' + className + '"></span>';
            },
          }}
          spaceBetween={0}
          slidesPerView={1}
          onSlideChange={handleSlideChange}
          onReachEnd={(swiper) => {
            const nextButton = swiper.navigation.nextEl;
            if (nextButton) {
              nextButton.addEventListener('click', onClose);
            }
          }}
          style={{
            width: '100%',
            height: '100%',
            '--swiper-pagination-color': 'rgba(255, 255, 255, 1)',
            '--swiper-pagination-bullet-inactive-color': 'rgba(255, 255, 255, 0.2)',
            '--swiper-pagination-bullet-inactive-opacity': '1',
            '--swiper-pagination-bullet-size': '10px',
            '--swiper-pagination-bullet-horizontal-gap': '5px',
            '--swiper-navigation-color': 'rgba(255, 255, 255, 1)',
            '--swiper-navigation-size': '30px',
          } as any}
        >
          {slides.map((slide, index) => (
            <SwiperSlide key={index}>
              <Box
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  backgroundColor: 'rgba(10, 10, 10, 1)',
                  alignItems: 'center',
                  justifyContent: 'flex-start',
                  padding: '60px 40px 40px 40px',
                  ...(index === 3 && {
                    background: 'linear-gradient(157deg, rgba(219, 255, 59, 0.00) 66.32%, #DBFF3B 150.3%), #0A0A0A',
                  }),
                  gap: '38px',
                }}
              >
                {slide.logo && (
                  <Box
                    component="img"
                    src={slide.logo}
                    alt="Logo"
                    sx={{
                      width: 'auto',
                      height: '27px',
                      marginBottom: 0,
                    }}
                  />
                )}
                {typeof slide.title === 'string' ? (
                  <Typography 
                    variant="h4" 
                    component="h2" 
                    sx={{ 
                      color: '#FFF',
                      fontFamily: 'Inter',
                      fontSize: '30px',
                      fontStyle: 'normal',
                      fontWeight: 400,
                      lineHeight: '120%',
                      margin: 0,
                      paddingBottom: '38px',
                      textAlign: 'center',
                      leadingTrim: 'both',
                      textEdge: 'cap',
                      maxWidth: '600px',
                    }}
                  >
                    {slide.title}
                  </Typography>
                ) : (
                  <Typography 
                    variant="h4" 
                    component="h2" 
                    sx={{ 
                      color: '#FFF',
                      fontFamily: 'Inter',
                      fontSize: '30px',
                      fontStyle: 'normal',
                      fontWeight: 400,
                      lineHeight: '120%',
                      margin: 0,
                      paddingBottom: '38px',
                      textAlign: 'center',
                      leadingTrim: 'both',
                      textEdge: 'cap',
                      maxWidth: '600px',
                    }}
                  >
                    {slide.title}
                  </Typography>
                )}
                <Box
                  component="img"
                  src={slide.image}
                  alt="Slide image"
                  sx={{
                    width: '409px',
                    height: 'auto',
                    objectFit: 'cover',
                    borderRadius: '15px',
                  }}
                />
              </Box>
            </SwiperSlide>
          ))}
        </Swiper>
      </DialogContent>
    </Dialog>
  );
};

export default WelcomePopup; 