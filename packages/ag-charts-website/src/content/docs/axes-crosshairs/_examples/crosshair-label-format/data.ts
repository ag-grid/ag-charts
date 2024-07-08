// Source: https://www.gov.uk/government/statistics/renewable-sources-of-energy-chapter-6-digest-of-united-kingdom-energy-statistics-dukes
export function getData() {
    return [
        {
            year: new Date(2017, 0, 1),
            'Onshore wind': 2470,
            'Offshore wind': 1798,
            'Solar photovoltaics': 985,
            'Small scale Hydro': 112,
        },
        {
            year: new Date(2018, 0, 1),
            'Onshore wind': 2612,
            'Offshore wind': 2281,
            'Solar photovoltaics': 1089,
            'Small scale Hydro': 111,
        },
        {
            year: new Date(2019, 0, 1),
            'Onshore wind': 2739,
            'Offshore wind': 2749,
            'Solar photovoltaics': 1068,
            'Small scale Hydro': 120,
        },
        {
            year: new Date(2020, 0, 1),
            'Onshore wind': 3004,
            'Offshore wind': 3498,
            'Solar photovoltaics': 1109,
            'Small scale Hydro': 134,
        },
        {
            year: new Date(2021, 0, 1),
            'Onshore wind': 2507,
            'Offshore wind': 3053,
            'Solar photovoltaics': 1044,
            'Small scale Hydro': 119,
        },
    ];
}
