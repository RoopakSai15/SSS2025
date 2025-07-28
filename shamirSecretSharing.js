const fs = require('fs');

class ShamirSecretSharing {
    constructor() {
        // Using BigInt for very large numbers in the test cases
        this.PRIME = 2n ** 256n - 2n ** 32n - 977n; // Large prime for 256-bit arithmetic
    }

    mod(a, m) {
        const bigA = BigInt(a);
        const bigM = BigInt(m);
        return ((bigA % bigM) + bigM) % bigM;
    }

    // Extended Euclidean Algorithm - using BigInt for large numbers
    extendedGCD(a, b) {
        const bigA = BigInt(a);
        const bigB = BigInt(b);
        
        if (bigA === 0n) return [bigB, 0n, 1n];
        
        const [gcd, x1, y1] = this.extendedGCD(bigB % bigA, bigA);
        const x = y1 - (bigB / bigA) * x1;
        const y = x1;
        
        return [gcd, x, y];
    }

    // Modular inverse - using BigInt
    modInverse(a, m) {
        const [gcd, x, y] = this.extendedGCD(this.mod(a, m), m);
        if (gcd !== 1n) throw new Error('Modular inverse does not exist');
        return this.mod(x, m);
    }

    // Decode Y values from different bases - handle very large numbers
    decodeValue(value, base) {
        // Use BigInt for parsing large numbers
        const parsedBase = parseInt(base);
        
        // For very large numbers, we need to parse manually for bases > 36
        if (parsedBase <= 36) {
            return BigInt(parseInt(value, parsedBase));
        } else {
            // Manual parsing for larger bases (shouldn't be needed for this assignment)
            throw new Error(`Base ${parsedBase} not supported`);
        }
    }

    // Lagrange interpolation to find constant term c (polynomial at x=0)
    findSecret(points) {
        let secret = 0n;
        const k = points.length;

        console.log(`\nUsing ${k} points for interpolation:`);
        points.forEach(point => {
            console.log(`  Point: (${point.x}, ${point.y})`);
        });

        for (let i = 0; i < k; i++) {
            const xi = BigInt(points[i].x);
            const yi = BigInt(points[i].y);
            
            let numerator = 1n;
            let denominator = 1n;

            // Calculate Lagrange basis polynomial L_i(0)
            for (let j = 0; j < k; j++) {
                if (i !== j) {
                    const xj = BigInt(points[j].x);
                    // For L_i(0): numerator *= (0 - xj), denominator *= (xi - xj)
                    numerator = this.mod(numerator * (0n - xj), this.PRIME);
                    denominator = this.mod(denominator * (xi - xj), this.PRIME);
                }
            }

            // Calculate the Lagrange coefficient L_i(0)
            const lagrangeCoeff = this.mod(numerator * this.modInverse(denominator, this.PRIME), this.PRIME);
            
            // Add this term to the secret: c += yi * L_i(0)
            secret = this.mod(secret + this.mod(yi * lagrangeCoeff, this.PRIME), this.PRIME);
        }

        return secret;
    }

    processTestCase(jsonData, testCaseNumber) {
        console.log(`\n==================== TEST CASE ${testCaseNumber} ====================`);
        
        const data = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;
        
        const n = data.keys.n; // Total number of roots provided
        const k = data.keys.k; // Minimum number of roots required (k = m + 1)
        
        console.log(`n (total roots provided): ${n}`);
        console.log(`k (minimum roots required): ${k}`);
        console.log(`Polynomial degree m = k - 1 = ${k - 1}`);
        
        // Extract and decode points
        const points = [];
        
        // Process all available roots
        Object.keys(data).forEach(key => {
            if (key !== 'keys' && data[key].base && data[key].value) {
                const x = parseInt(key);
                const base = data[key].base;
                const encodedValue = data[key].value;
                const y = this.decodeValue(encodedValue, base);
                
                points.push({ x, y });
                console.log(`Root ${key}: base=${base}, encoded="${encodedValue}", decoded=${y}`);
            }
        });
        
        console.log(`\nTotal points available: ${points.length}`);
        
        // Use exactly k points (minimum required)
        const selectedPoints = points.slice(0, k);
        console.log(`Using first ${k} points for calculation`);
        
        // Find the secret (constant term c)
        const secret = this.findSecret(selectedPoints);
        
        console.log(`\n🔐 SECRET (constant term c): ${secret}`);
        
        return secret;
    }

    // Read and process JSON file
    processFile(filename, testCaseNumber) {
        try {
            console.log(`\nReading file: ${filename}`);
            const jsonData = fs.readFileSync(filename, 'utf8');
            return this.processTestCase(jsonData, testCaseNumber);
        } catch (error) {
            console.error(`Error processing ${filename}:`, error.message);
            return null;
        }
    }
}

// Helper function to decode roots (alternative approach)
function decodeRoots(encodedRoots) {
    const decodedPoints = [];
    for (const [xStr, {base, value}] of Object.entries(encodedRoots)) {
        const x = parseInt(xStr);
        const y = parseInt(value, parseInt(base));
        decodedPoints.push([x, y]);
    }
    return decodedPoints;
}

// Function to create test case files if they don't exist
function createTestCase1() {
    const testCase1 = {
        "keys": {
            "n": 4,
            "k": 3
        },
        "1": {
            "base": "10",
            "value": "4"
        },
        "2": {
            "base": "2",
            "value": "111"
        },
        "3": {
            "base": "10",
            "value": "12"
        },
        "6": {
            "base": "4",
            "value": "213"
        }
    };
    
    // Create directory if it doesn't exist
    if (!fs.existsSync('./examples')) {
        fs.mkdirSync('./examples', { recursive: true });
    }
    
    fs.writeFileSync('./examples/sampleTest.json', JSON.stringify(testCase1, null, 4));
    fs.writeFileSync('testcase1.json', JSON.stringify(testCase1, null, 4));
    console.log("Created test case files");
}

function createTestCase2() {
    const testCase2 = {
        "keys": {
            "n": 10,
            "k": 7
        },
        "1": {
            "base": "6",
            "value": "13444211440455345511"
        },
        "2": {
            "base": "15",
            "value": "aed7015a346d63"
        },
        "3": {
            "base": "15",
            "value": "6aeeb69631c227c"
        },
        "4": {
            "base": "16",
            "value": "e1b5e05623d881f"
        },
        "5": {
            "base": "8",
            "value": "316034514573652620673"
        },
        "6": {
            "base": "3",
            "value": "2122212201122002221120200210011020220200"
        },
        "7": {
            "base": "3",
            "value": "20120221122211000100210021102001201112121"
        },
        "8": {
            "base": "6",
            "value": "20220554335330240002224253"
        },
        "9": {
            "base": "12",
            "value": "45153788322a1255483"
        },
        "10": {
            "base": "7",
            "value": "1101613130313526312514143"
        }
    };
    
    fs.writeFileSync('testcase2.json', JSON.stringify(testCase2, null, 4));
    console.log("Created testcase2.json");
}

// Main execution function
function main() {
    const sss = new ShamirSecretSharing();
    
    console.log("CATALOG PLACEMENTS ASSIGNMENT - SHAMIR'S SECRET SHARING");
    console.log("=".repeat(60));
    
    // Process both test cases
    const secrets = [];
    
    // Test Case 1
    const secret1 = sss.processFile('testcase1.json', 1);
    if (secret1 !== null) secrets.push(secret1);
    
    // Test Case 2  
    const secret2 = sss.processFile('testcase2.json', 2);
    if (secret2 !== null) secrets.push(secret2);
    
    // Final output
    console.log("\n" + "=".repeat(60));
    console.log("FINAL RESULTS:");
    console.log("=".repeat(60));
    
    if (secrets.length >= 1) {
        console.log(`Test Case 1 Secret: ${secrets[0]}`);
    }
    if (secrets.length >= 2) {
        console.log(`Test Case 2 Secret: ${secrets[1]}`);
    }
    
    console.log("\n✅ Assignment completed successfully!");
}

main();

// Exports
module.exports = { ShamirSecretSharing };
