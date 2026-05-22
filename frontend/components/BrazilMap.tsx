import React from 'react';
import { ComposableMap, Geographies, Geography } from 'react-simple-maps';

// Usamos um GeoJSON público e confiável com o desenho perfeito do Brasil
const geoUrl = "https://raw.githubusercontent.com/codeforamerica/click_that_hood/master/public/data/brazil-states.geojson";

interface BrazilMapProps {
  activeRegions: string[];
  selectedRegion: string;
  onSelectRegion: (region: string) => void;
}

export const BrazilMap: React.FC<BrazilMapProps> = ({ activeRegions, selectedRegion, onSelectRegion }) => {

  // 🧠 INTELIGÊNCIA GEOGRÁFICA DA GSA
  // Essa função traduz o Estado físico para a Região de Negócio do seu banco
  const getRegionKey = (sigla: string) => {
    // Se for os estados principais, mantém a sigla
    if (['GO', 'MT', 'TO'].includes(sigla)) return sigla;
    
    // Se for Nordeste (ou qualquer outro estado de expansão), agrupa como "INDIRETO" (Externo)
    return 'INDIRETO'; 
  };

  return (
    <div className="w-full h-full min-h-[500px] flex items-center justify-center relative">
      <ComposableMap
        projection="geoMercator"
        projectionConfig={{
          // 2. AUMENTAMOS O ZOOM DA LENTE (de 650 para 850)
          scale: 850,          
          center: [-54, -15]
        }}
        style={{ width: "100%", height: "auto" }}
      >
        <Geographies geography={geoUrl}>
          {({ geographies }) =>
            geographies.map((geo) => {
              // O GeoJSON traz a sigla do estado (ex: "BA", "GO", "SP")
              const sigla = geo.properties.sigla; 
              
              // Descobre se esse estado é GO/MT/TO ou se faz parte do "EXTERNO" (INDIRETO)
              const regionKey = getRegionKey(sigla);

              // Verifica se a GSA tem equipe ativa nessa macrorregião
              const isActive = activeRegions.includes(regionKey);
              const isSelected = selectedRegion === regionKey;

              // 🎨 DESIGN SYSTEM (Renderização de Cores)
              let fillColor = "#f1f5f9"; // Cinza super claro para estados sem operação
              let hoverColor = "#e2e8f0";
              let strokeColor = "#ffffff"; // Fronteiras brancas e limpas

              if (isActive) {
                if (regionKey === 'GO') {
                  // MATRIZ (Goiás): Verde GSA vibrante
                  fillColor = isSelected ? "#16a34a" : "#4ade80"; // green-600 : green-400
                  hoverColor = isSelected ? "#15803d" : "#22c55e";
                } else if (regionKey === 'MT' || regionKey === 'TO') {
                  // FILIAIS PRINCIPAIS (MT, TO): Azul Corporativo
                  fillColor = isSelected ? "#3925eb" : "#60a5fa"; // blue-600 : blue-400
                  hoverColor = isSelected ? "#3925eb" : "#3b82f6";
                } else if (regionKey === 'INDIRETO') {
                  // EXTERNO (Nordeste etc): Cor neutra/secundária para não roubar a atenção
                  fillColor = isSelected ? "#64748b" : "#cbd5e1"; // slate-500 : slate-300
                  hoverColor = isSelected ? "#475569" : "#94a3b8";
                }
              }

              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  onClick={() => {
                    if (isActive) onSelectRegion(regionKey);
                  }}
                  style={{
                    default: {
                      fill: fillColor,
                      stroke: strokeColor,
                      strokeWidth: 1,
                      outline: "none",
                      transition: "all 300ms ease" // Animação suave 
                    },
                    hover: {
                      fill: isActive ? hoverColor : fillColor,
                      stroke: strokeColor,
                      strokeWidth: 1.5,
                      outline: "none",
                      cursor: isActive ? "pointer" : "default",
                      // Um leve efeito de "elevação" no estado quando passa o mouse
                      transform: isActive ? "translateY(-1px)" : "none" 
                    },
                    pressed: {
                      fill: "#1e40af", // Azul bem escuro ao clicar
                      outline: "none"
                    }
                  }}
                >
                  {/* Tooltip Nativo do Navegador para acessibilidade */}
                  <title>
                    {isActive 
                      ? `Equipes GSA: ${regionKey === 'INDIRETO' ? 'Canal EXTERNO (Nordeste)' : regionKey}` 
                      : `Sem operação comercial em ${sigla}`}
                  </title>
                </Geography>
              );
            })
          }
        </Geographies>
      </ComposableMap>
    </div>
  );
};