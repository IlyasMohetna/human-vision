export const WMO_WEATHER_GROUPS = {
  '00-19': {
    label: 'No precipitation, fog, ice fog, duststorm, etc. (last hour)',
    image: 'https://cdn-icons-png.flaticon.com/512/5903/5903939.png',
    codes: [
      0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19,
    ],
  },
  '20-29': {
    label:
      'Precipitation, fog, ice fog, or thunderstorm (in last hour but not now)',
    image:
      'https://cdn2.iconfinder.com/data/icons/weather-flat-14/64/weather06-512.png',
    codes: [20, 21, 22, 23, 24, 25, 26, 27, 28, 29],
  },
  '30-39': {
    label: 'Duststorm, sandstorm, drifting or blowing snow',
    image: 'https://cdn-icons-png.flaticon.com/512/3920/3920857.png',
    codes: [30, 31, 32, 33, 34, 35, 36, 37, 38, 39],
  },
  '90-99': {
    label: 'Thunderstorms, possibly with hail or duststorm',
    image: 'https://cdn-icons-png.flaticon.com/512/3104/3104612.png',
    codes: [90, 91, 92, 93, 94, 95, 96, 97, 98, 99],
  },
};
