import json
import urllib.request
import math

def fetch_periodic_table():
    """
    Fetches the latest Periodic Table data in JSON format.
    """
    url = "https://raw.githubusercontent.com/Bowserinator/Periodic-Table-JSON/master/PeriodicTableJSON.json"
    try:
        with urllib.request.urlopen(url) as response:
            data = json.loads(response.read().decode())
            elements = data['elements']
            processed = []
            for el in elements:
                processed.append({
                    "number": el.get("number"),
                    "symbol": el.get("symbol"),
                    "name": el.get("name"),
                    "mass": el.get("atomic_mass"),
                    "category": el.get("category"),
                    "electron_config": el.get("electron_configuration"),
                    "electronegativity": el.get("electronegativity_pauling"),
                    "melting_point": el.get("melt"),
                    "boiling_point": el.get("boil"),
                    "phase": el.get("phase"),
                    "summary": el.get("summary")
                })
            return processed
    except Exception as e:
        return {"error": str(e)}

def fetch_codata_constants():
    """
    Fetches high-precision physical constants from a CODATA mirror.
    Extracts: STT (Index), Name, Symbol, Value, Uncertainty, Unit, Category.
    """
    # Using a reliable CODATA 2018/2022 mirror
    url = "https://raw.githubusercontent.com/piinalpin/codata-data/master/data/codata-2018.json"
    try:
        with urllib.request.urlopen(url) as response:
            raw_data = json.loads(response.read().decode())
            # Transform into a clean list for UI/iOS
            processed = []
            
            # Map common categories
            category_map = {
                "speed of light in vacuum": "Universal",
                "elementary charge": "Electromagnetic",
                "planck constant": "Universal",
                "gravitational constant": "Universal",
                "boltzmann constant": "Universal",
                "avogadro constant": "Atomic",
                "electron mass": "Atomic",
                "proton mass": "Atomic",
                "molar gas constant": "Universal",
                "stefan-boltzmann constant": "Universal",
                "fine-structure constant": "Electromagnetic"
            }
            
            # Map common symbols
            symbol_map = {
                "speed of light in vacuum": "c",
                "elementary charge": "e",
                "planck constant": "h",
                "gravitational constant": "G",
                "boltzmann constant": "k_B",
                "avogadro constant": "N_A",
                "electron mass": "m_e",
                "proton mass": "m_p",
                "molar gas constant": "R",
                "stefan-boltzmann constant": "sigma",
                "fine-structure constant": "alpha"
            }

            # Sort by name A-Z
            raw_data.sort(key=lambda x: x.get("quantity", ""))

            for idx, item in enumerate(raw_data, 1):
                name = item.get("quantity")
                value_str = item.get("value").replace(" ", "").replace("...", "")
                uncertainty = item.get("uncertainty")
                unit = item.get("unit")
                
                symbol = symbol_map.get(name.lower(), "")
                category = category_map.get(name.lower(), "Other")
                
                processed.append({
                    "stt": idx,
                    "name": name,
                    "symbol": symbol,
                    "value": value_str,
                    "uncertainty": uncertainty,
                    "unit": unit,
                    "category": category
                })
            return processed
    except Exception as e:
        return {"error": str(e)}

class ScientificConverter:
    """
    High-precision converter using fetched constants.
    """
    def __init__(self, constants):
        self.constants = constants
        # Get 'e' for eV conversions
        self.e_charge = constants.get("elementary charge", {}).get("value", 1.602176634e-19)

    def convert_energy(self, value, from_unit, to_unit):
        # Base unit: Joule (J)
        factors = {
            "J": 1.0,
            "eV": self.e_charge,
            "cal": 4.184,
            "kgf.m": 9.80665
        }
        return value * factors[from_unit] / factors[to_unit]

if __name__ == "__main__":
    print("Fetching Scientific Data...")
    pt = fetch_periodic_table()
    consts = fetch_codata_constants()
    
    if "error" not in consts:
        print(f"Successfully fetched {len(consts)} high-precision constants.")
        c = consts.get("speed of light in vacuum")
        print(f"Example: {c['name']} ({c['symbol']}) = {c['value']} {c['unit']}")
        
        # Test converter with high precision 'e'
        conv = ScientificConverter(consts)
        print(f"10 eV to Joules: {conv.convert_energy(10, 'eV', 'J')}")
