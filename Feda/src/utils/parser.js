export default function parseToDNA(input) {
    const lines = input.split('\n');
    let buildings = [];

    for (let line of lines) {
        line = line.trim();
        if (line.startsWith('-')) {
            const nameMatch = line.match(/- [^\s]+ ([^\(]+)\s*\(/);
            const addressMatch = line.match(/at (0x[0-9a-fA-F]{40})/);
            const uriMatch = line.match(/at (ipfs:\/\/[^\s]+)/);

            const building = {
                name: nameMatch ? nameMatch[1].trim() : ''
            };
            if (addressMatch) building.address = addressMatch[1];
            if (uriMatch) building.address = uriMatch[1];

            buildings.push(building);
        }
    }

    if (buildings.length === 0) throw new Error("At least one building is required.");

    const jsonDNA = JSON.stringify(buildings);
    return jsonDNA;
}

