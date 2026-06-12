import { useState, useEffect, useCallback } from 'react';
import { GoogleMap, LoadScript, Marker, InfoWindow } from '@react-google-maps/api';
import { ActionButton } from '@/components/ui/action-button';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MapPin, Navigation, Star, Clock, Loader2, RefreshCw, Phone, AlertCircle } from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/contexts/LanguageContext';

interface Hospital {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  rating: number;
  open_now?: boolean;
  place_id?: string;
  phone?: string;
}

const mapContainerStyle = {
  width: '100%',
  height: '480px',
  borderRadius: '12px',
};

export default function Hospitals() {
  const { t } = useTranslation();
  const { currentLanguage } = useLanguage();
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [filteredHospitals, setFilteredHospitals] = useState<Hospital[]>([]);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [mapCenter, setMapCenter] = useState({ lat: 28.7041, lng: 77.1025 }); // Default to Delhi
  const [activeMarker, setActiveMarker] = useState<string | null>(null);

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string;

  const handleCurrentLocation = useCallback(() => {
    return new Promise<void | boolean>((resolve) => {
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            try {
              setMapCenter({ lat: latitude, lng: longitude });
              setUserLocation({ lat: latitude, lng: longitude });

              const response: any = await api.findNearbyHospitals(latitude, longitude);
              const hospitalList = response.hospitals || [];
              setHospitals(hospitalList);
              setFilteredHospitals(hospitalList);

              resolve();
            } catch (error) {
              console.error('Error finding hospitals:', error);
              toast.error('Failed to find hospitals');
              resolve(false);
            }
          },
          () => {
            toast.error('Location access denied');
            resolve(false);
          }
        );
      } else {
        toast.error('Geolocation not supported');
        resolve(false);
      }
    });
  }, []);

  // Filter hospitals based on search query
  useEffect(() => {
    let filtered = hospitals;

    if (searchQuery.trim()) {
      filtered = filtered.filter(
        (h) =>
          h.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          h.address.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Sort by distance if user location available
    if (userLocation) {
      filtered.sort((a, b) => {
        const distA = parseFloat(calculateDistance(a.latitude, a.longitude) || '999');
        const distB = parseFloat(calculateDistance(b.latitude, b.longitude) || '999');
        return distA - distB;
      });
    }

    setFilteredHospitals(filtered);
  }, [searchQuery, hospitals, userLocation]);

  const calculateDistance = (lat: number, lng: number): string | null => {
    if (!userLocation) return null;
    const R = 6371;
    const dLat = ((lat - userLocation.lat) * Math.PI) / 180;
    const dLng = ((lng - userLocation.lng) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((userLocation.lat * Math.PI) / 180) *
      Math.cos((lat * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return (R * c).toFixed(1);
  };

  const getDirections = (hospital: Hospital) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${hospital.latitude},${hospital.longitude}`;
    window.open(url, '_blank');
  };

  return (
    <div className="min-h-screen bg-transparent py-4 sm:py-8">
      <div className="w-full px-4 md:px-6 lg:px-8 mx-auto">
        {/* Header */}
        <div className="mb-6 lg:mb-8">
          <h1 className="text-2xl lg:text-4xl font-bold mb-2 theme-title">
            {t('hospitals.title', 'Nearby Hospitals')}
          </h1>
          <p className="text-muted-foreground text-sm lg:text-lg">
            {t('hospitals.subtitle', 'Find healthcare facilities near your location')}
          </p>
        </div>

        {/* Main Layout */}
        <div className="flex flex-col gap-6">
          <div className="w-full flex flex-col gap-3 lg:gap-4">
            <Card className="p-4 glass w-full">
              <div className="flex flex-col gap-4 lg:gap-6">


                {/* Full Width Map */}
                <div className="w-full h-[300px] lg:h-[384px]">
                  {apiKey ? (
                    <LoadScript googleMapsApiKey={apiKey}>
                      <GoogleMap
                        mapContainerStyle={{ width: '100%', height: '100%', borderRadius: '12px' }}
                        center={mapCenter}
                        zoom={12}
                        mapTypeId="satellite"
                        options={{
                          styles: [
                            {
                              featureType: 'poi',
                              elementType: 'labels',
                              stylers: [{ visibility: 'off' }],
                            },
                          ],
                        }}
                      >
                        {userLocation && (
                          <Marker
                            position={{ lat: userLocation.lat, lng: userLocation.lng }}
                            title="Your Location"
                            icon="http://maps.google.com/mapfiles/ms/icons/blue-dot.png"
                          />
                        )}
                        {filteredHospitals.map((hospital, index) => (
                          <Marker
                            key={index}
                            position={{ lat: hospital.latitude, lng: hospital.longitude }}
                            title={hospital.name}
                            onClick={() => {
                              setSelectedHospital(hospital);
                              setActiveMarker(hospital.name);
                            }}
                            icon={{
                              path: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z',
                              fillColor: selectedHospital?.name === hospital.name ? '#ef4444' : '#3b82f6',
                              fillOpacity: 1,
                              strokeColor: '#fff',
                              strokeWeight: 2,
                              scale: 2,
                            }}
                          />
                        ))}
                        {selectedHospital && activeMarker === selectedHospital.name && (
                          <InfoWindow
                            position={{ lat: selectedHospital.latitude, lng: selectedHospital.longitude }}
                            onCloseClick={() => {
                              setSelectedHospital(null);
                              setActiveMarker(null);
                            }}
                          >
                            <div className="text-sm w-64 p-2">
                              <h3 className="font-bold text-base mb-2">{selectedHospital.name}</h3>
                              <p className="text-xs text-gray-600 mb-2 flex items-start gap-1">
                                <MapPin className="h-3 w-3 mt-0.5 flex-shrink-0" />
                                {selectedHospital.address}
                              </p>
                              {userLocation && (
                                <p className="text-xs font-semibold mb-2 text-blue-600">
                                  {calculateDistance(selectedHospital.latitude, selectedHospital.longitude)} km away
                                </p>
                              )}
                              {selectedHospital.rating > 0 && (
                                <div className="flex items-center gap-1 mb-2">
                                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                  <span className="text-xs font-semibold">{selectedHospital.rating}</span>
                                </div>
                              )}
                              {selectedHospital.open_now !== undefined && (
                                <p className={`text-xs font-semibold mb-2 ${selectedHospital.open_now ? 'text-green-600' : 'text-red-600'}`}>
                                  {selectedHospital.open_now ? 'Open Now' : 'Closed'}
                                </p>
                              )}
                              <Button size="sm" className="w-full text-xs" onClick={() => getDirections(selectedHospital)}>
                                Get Directions
                              </Button>
                            </div>
                          </InfoWindow>
                        )}
                      </GoogleMap>
                    </LoadScript>
                  ) : (
                    <Card className="h-full flex items-center justify-center glass">
                      <div className="text-center">
                        <AlertCircle className="h-12 w-12 mx-auto mb-4 text-destructive" />
                        <p className="text-muted-foreground">Google Maps API Key not configured</p>
                      </div>
                    </Card>
                  )}
                </div>

                {/* Location Action */}
                <ActionButton
                  action={handleCurrentLocation}
                  successMessage={t('hospitals.found', 'Hospitals Found')}
                  className="w-full text-xs lg:text-sm h-9 lg:h-10"
                  size="sm"
                >
                  {t('hospitals.use_location', 'Use My Location')}
                </ActionButton>

                {/* Results Section */}
                {hospitals.length > 0 && (
                  <div className="flex flex-col gap-4">
                    <Input
                      placeholder={t('hospitals.search_placeholder', 'Search hospitals...')}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />

                    {filteredHospitals.length === 0 ? (
                      <Card className="p-8 text-center glass">
                        <AlertCircle className="h-12 w-12 mx-auto mb-4 text-yellow-600" />
                        <h3 className="text-lg font-semibold mb-2">{t('hospitals.no_match', 'No matches found')}</h3>
                        <p className="text-sm text-muted-foreground">Try adjusting your search query</p>
                      </Card>
                    ) : (
                      <div className="space-y-3">
                        <p className="text-xs text-muted-foreground px-2 font-semibold">
                          {t('hospitals.showing', 'Showing')} {filteredHospitals.length} {t('hospitals.hospitals', 'hospitals')}
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
                          {filteredHospitals.map((hospital, index) => (
                            <Card
                              key={index}
                              className={`p-4 cursor-pointer transition-all hover:shadow-lg glass ${selectedHospital?.name === hospital.name
                                ? 'border-primary border-2 bg-primary/5'
                                : 'hover:border-primary/50'
                                }`}
                              onClick={() => {
                                setSelectedHospital(hospital);
                                setActiveMarker(hospital.name);
                                setMapCenter({ lat: hospital.latitude, lng: hospital.longitude });
                              }}
                            >
                              <div className="space-y-2 h-full flex flex-col justify-between">
                                <div>
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1">
                                      <h3 className="font-semibold text-sm leading-tight line-clamp-2">{hospital.name}</h3>
                                    </div>
                                    {hospital.rating > 0 && (
                                      <div className="flex items-center gap-1 bg-primary/10 px-2 py-1 rounded text-xs flex-shrink-0">
                                        <Star className="h-3 w-3 fill-primary text-primary" />
                                        <span className="font-semibold">{hospital.rating}</span>
                                      </div>
                                    )}
                                  </div>
                                  <p className="text-xs text-muted-foreground flex items-start gap-1 mt-2">
                                    <MapPin className="h-3 w-3 mt-0.5 flex-shrink-0" />
                                    <span className="line-clamp-2">{hospital.address}</span>
                                  </p>
                                  <div className="flex flex-col gap-1 pt-2">
                                    {userLocation && (
                                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                        <Navigation className="h-3 w-3" />
                                        <span className="font-medium">{calculateDistance(hospital.latitude, hospital.longitude)} km away</span>
                                      </div>
                                    )}
                                    {hospital.open_now !== undefined && (
                                      <div className="flex items-center gap-1 text-xs">
                                        <Clock className="h-3 w-3" />
                                        <span className={hospital.open_now ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                                          {hospital.open_now ? t('hospitals.open_now', 'Open Now') : t('hospitals.closed', 'Closed')}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <Button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    getDirections(hospital);
                                  }}
                                  size="sm"
                                  className="w-full text-xs h-8 mt-4"
                                >
                                  <Navigation className="h-3 w-3 mr-1" />
                                  {t('hospitals.get_directions', 'Directions')}
                                </Button>
                              </div>
                            </Card>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
