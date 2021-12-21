// Source: https://www.gov.uk/government/statistics/english-housing-survey-2016-stock-condition
function getData() {
    return [
        { type: "Small terraced house", ownerOccupied: 1013, privateRented: 822, localAuthority: 168, housingAssociation: 295 },
        { type: "Medium/large terraced house", ownerOccupied: 2842, privateRented: 938, localAuthority: 231, housingAssociation: 422 },
        { type: "Semi-detached house", ownerOccupied: 4567, privateRented: 773, localAuthority: 274, housingAssociation: 388 },
        { type: "Detached house", ownerOccupied: 3655, privateRented: 294, localAuthority: 4, housingAssociation: 19 },
        { type: "Bungalow", ownerOccupied: 1486, privateRented: 214, localAuthority: 180, housingAssociation: 228 },
        { type: "Converted flat", ownerOccupied: 252, privateRented: 539, localAuthority: 37, housingAssociation: 100 },
        { type: "Purpose-built flat low rise", ownerOccupied: 905, privateRented: 1139, localAuthority: 621, housingAssociation: 919 },
        { type: "Purpose-built flat high rise", ownerOccupied: 97, privateRented: 134, localAuthority: 109, housingAssociation: 68 }
    ];
}