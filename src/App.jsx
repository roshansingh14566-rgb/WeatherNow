
import { useEffect, useState } from 'react'
import './App.css'

const API_KEY = import.meta.env.VITE_WEATHER_API_KEY

function App() {
  const [city, setCity] = useState('')
  const [weather, setWeather] = useState(null)
  const [forecast, setForecast] = useState(null)
  
  const [unit, setUnit] = useState('C')

  function displayTemp(celsius) {
    return Math.round(
      unit === 'C' ? celsius : (celsius * 9) / 5 + 32
    )
  }
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [searchHistory, setSearchHistory] = useState(() => {
    try {
      return JSON.parse(
        localStorage.getItem('weatherSearchHistory') || '[]'
      )
    } catch {
      return []
    }
  })
  
  useEffect(() => {
    localStorage.setItem(
      'weatherSearchHistory',
      JSON.stringify(searchHistory)
    )
  }, [searchHistory])

  
  async function handleCitySearch(cityName) {
    setCity(cityName)

    if (!API_KEY) {
      setError('API key nahi mili. Apni .env file check karo.')
      return
    }

    setLoading(true)
    setError('')
    setWeather(null)

    try {
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(cityName)}&appid=${API_KEY}&units=metric`
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Weather load nahi ho paaya.')
      }

      setWeather(data)

      const forecastResponse = await fetch(
        `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(cityName)}&appid=${API_KEY}&units=metric`
      )

      if (forecastResponse.ok) {
        setForecast(await forecastResponse.json())
      } else {
        setForecast(null)
      }
    } catch (err) {
      setError(err.message || 'Internet connection check karo.')
    } finally {
      setLoading(false)
    }
  }

  
  async function handleSearch(e) {
    e.preventDefault()

    if (!city.trim()) {
      setError('Please enter a city name.')
      return
    }

    if (!API_KEY) {
      setError('API key nahi mili. Apni .env file check karo.')
      return
    }

    setLoading(true)
    setError('')
    setWeather(null)

    try {
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city.trim())}&appid=${API_KEY}&units=metric`
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.message === 'city not found'
            ? 'City nahi mili. Spelling check karo.'
            : data.message || 'Weather load nahi ho paaya.'
        )
      }

      setWeather(data)
      
      const forecastResponse = await fetch(
        `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city.trim())}&appid=${API_KEY}&units=metric`
      )

      if (forecastResponse.ok) {
        const forecastData = await forecastResponse.json()
        setForecast(forecastData)
      } else {
        setForecast(null)
      }

      setSearchHistory((previous) => [
        data.name,
        ...previous.filter((name) => name !== data.name),
      ].slice(0, 5))
    } catch (err) {
      setError(err.message || 'Internet connection check karo.')
    } finally {
      setLoading(false)
    }
  }
  
  function handleLocation() {
    if (!navigator.geolocation) {
      setError('Your browser does not support location.')
      return
    }

    setLoading(true)
    setError('')

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords

          const response = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${API_KEY}&units=metric`
          )

          const data = await response.json()

          if (!response.ok) {
            throw new Error(data.message || 'Weather load nahi hua.')
          }

          setWeather(data)
          setCity(data.name)

          const forecastResponse = await fetch(
            `https://api.openweathermap.org/data/2.5/forecast?lat=${latitude}&lon=${longitude}&appid=${API_KEY}&units=metric`
          )

          if (forecastResponse.ok) {
            setForecast(await forecastResponse.json())
          } else {
            setForecast(null)
          }
        } catch (err) {
          setError(err.message || 'Weather load nahi ho paaya.')
        } finally {
          setLoading(false)
        }
      },
      () => {
        setError('Location permission allow karo, phir dobara try karo.')
        setLoading(false)
      }
    )
  }

return (
    <div className="weather-app">

      <video
        key={weather?.weather?.[0]?.main || "default"}
        className="background-video"
        autoPlay
        muted
        loop
        playsInline
        aria-hidden="true"
      >
        <source
          src={
            {
              Clear: "/sunny-bg.mp4",
              Rain: "/rainy-bg.mp4",
              Drizzle: "/rainy-bg.mp4",
              Clouds: "/cloudy-bg.mp4",
              Snow: "/snowy-bg.mp4",
              Thunderstorm: "/thunderstorm-bg.mp4",
            }[weather?.weather?.[0]?.main] || "/weather-bg.mp4"
          }
          type="video/mp4"
        />
      </video>

      <div className="video-overlay"></div>
    
      <header className="topbar">
        <h2>☀️ WeatherNow</h2>
        <span>Realtime Weather App</span>
      </header>

      <main className="weather-content">
        <p className="eyebrow">YOUR DAILY WEATHER UPDATE</p>
        <h1>Weather, made simple.</h1>
        <p className="subtitle">
          Search for a city to see its current weather.
        </p>

        <form className="search-form" onSubmit={handleSearch}>
          <input
            type="text"
            placeholder="Enter city name, e.g. Dehradun"
            value={city}
            onChange={(e) => setCity(e.target.value)}
          />
          <button type="submit" disabled={loading}>
            {loading ? 'Loading...' : 'Search'}
          </button>
        </form>
        
        {loading && (
          <div className="weather-loading" role="status">
            <div className="weather-loader" />
            <p>Fetching your weather...</p>
          </div>
        )}

        <div className="unit-toggle">
          <button
            type="button"
            className={unit === 'C' ? 'unit-active' : ''}
            onClick={() => setUnit('C')}
          >
            °C
          </button>
          <button
            type="button"
            className={unit === 'F' ? 'unit-active' : ''}
            onClick={() => setUnit('F')}
          >
            °F
          </button>
        </div>

        <button
          type="button"
          onClick={handleLocation}
          disabled={loading}
          className="location-button"
        >
          {loading ? ' Getting Location...' : 'Use My Location'}
        </button>

        {error && <p role="alert">{error}</p>}

        {weather ? (
          <section className="weather-card">
            <p className="card-label">CURRENT WEATHER</p>

            <div className={`weather-icon animated-icon icon-${weather.weather[0].icon}`}>
              <img
                src={`https://openweathermap.org/img/wn/${weather.weather[0].icon}@4x.png`}
                alt={weather.weather[0].description}
              />
            </div>

            <h2>{weather.name}, {weather.sys.country}</h2>
            <h1>{displayTemp(weather.main.temp)}°{unit}</h1>
            <p className="weather-message">
              {weather.weather[0].description}
            </p>

            <div className="weather-details"> 
            <div className="detail-item">
              <span>🌡️ Pressure</span>
              <h3>{weather.main.pressure} hPa</h3>
            </div>


              <div className="detail-item">
                <span>💧 Humidity</span>
                <h3>{weather.main.humidity}%</h3>
              </div>

              <div className="detail-item">
                <span>💨 Wind Speed</span>
                <h3>{weather.wind.speed} m/s</h3>
              </div>

              <div className="detail-item">
                <span>👁️ Visibility</span>
                <h3>{(weather.visibility / 1000).toFixed(1)} km</h3>
              </div>

              <div className="detail-item">
                <span>🌅 Sunrise</span>
                <h3>
                  {new Date(weather.sys.sunrise * 1000).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </h3>
                <span>🌇 Sunset</span>
                <h3>
                  {new Date(weather.sys.sunset * 1000).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </h3>
              </div>
            </div>


          </section>
        ) : (
          !error && (
            <section className="weather-card">
              <div className="weather-icon">🌦️</div>
              <h2>{loading ? 'Getting weather...' : 'Find your city’s weather'}</h2>
              <p className="weather-message">
                {loading
                  ? 'Please wait a moment.'
                  : 'Enter a city above to begin.'}
              </p>
            </section>
          )
        )}
        
        {searchHistory.length > 0 && (
          <section className="weather-card">
            <h2>Recent Searches</h2>
            
            <button
              type="button"
              onClick={() => setSearchHistory([])}
              className="location-button"
            >
              Clear History
            </button>

            <div className="history-list">
              {searchHistory.map((cityName) => (
                <button
                  key={cityName}
                  type="button"
                  className="history-button"
                  onClick={() => {
                    setCity(cityName)
                    handleCitySearch(cityName)    
                  }}
                >
                  {cityName}
                </button>
              ))}
            </div>
          </section>
        )}


        <p className="footer-note">
          
        {forecast?.list && (
          <section className="weather-card">
            <h2>5-Day Forecast</h2>

            <div className="forecast-list">
              {forecast.list
                .filter((item) => item.dt_txt.includes('12:00:00'))
                .slice(0, 5)
                .map((item) => (
                  <div className="forecast-item" key={item.dt}>
                    <p>
                      {new Date(item.dt * 1000).toLocaleDateString('en-IN', {
                        weekday: 'short',
                        day: 'numeric',
                      })}
                    </p>

                    <img
                      src={`https://openweathermap.org/img/wn/${item.weather[0].icon}.png`}
                      alt={item.weather[0].description}
                    />

                    <h3>{displayTemp(item.main.temp)}°{unit}</h3>

                    <p>{item.weather[0].description}</p>
                  </div>
                ))}
            </div>
          </section>
      )}           
        <p className="app-footer">
          Made with ❤️ using React
          <span>WeatherNow · Real-time weather updates</span>
        </p>
        </p>
      </main>
    </div>
  )
}

export default App
