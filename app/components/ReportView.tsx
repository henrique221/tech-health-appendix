import React from 'react';
import Image from 'next/image';
import { HealthReport } from '../types';
import ScoreCard from './ScoreCard';
import { LanguageChart, ScoreRadar } from './MetricsChart';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import '../styles/report-view-dark.css';

interface ReportViewProps {
  report: HealthReport;
  onReset: () => void;
}

export default function ReportView({ report, onReset }: ReportViewProps) {
  const [isExporting, setIsExporting] = React.useState(false);

  // Format date
  const formattedDate = new Date(report.generatedAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Convert number to score color class
  const getScoreColorClass = (score: number) => {
    if (score >= 80) return 'score-excellent';
    if (score >= 60) return 'score-good';
    return 'score-poor';
  };

  // Export report as PDF with improved multi-page layout
  const exportAsPDF = async () => {
    try {
      setIsExporting(true);
      
      // Get all the sections we need to include in the PDF
      const reportElement = document.getElementById('report-container');
      const repoCard = document.querySelector('.repo-card');
      const scoreCards = document.querySelectorAll('.cards-grid .score-card');
      const chartCards = document.querySelectorAll('.chart-card');
      const roadmapCard = document.querySelector('.roadmap-card');
      
      if (!reportElement || !repoCard) return;
      
      // Add comprehensive PDF-safe CSS inline to override problematic color functions
      const pdfSafeStyle = document.createElement('style');
      pdfSafeStyle.id = 'pdf-safe-css';
      pdfSafeStyle.textContent = `
        /* Force all elements to use standard colors - no oklch, color-mix, or complex gradients */
        .pdf-temp-section * {
          color: inherit !important;
        }
        
        .pdf-temp-section {
          background: #FFFFFF !important; /* Pure white background */
          color: #1E293B !important; /* Slate-800 for better contrast */
          font-family: 'Arial', 'Segoe UI', system-ui, -apple-system, sans-serif !important;
          padding: 40px !important; /* Further increased padding */
          margin-bottom: 30px !important; /* Increased margin */
          border-radius: 0 !important; /* Cleaner look with no border radius */
          border: none !important; /* No border for cleaner look */
          box-shadow: 0 5px 15px rgba(0,0,0,0.05) !important; /* Subtle shadow */
        }
        
        /* Override all background colors with standard hex values */
        .pdf-temp-section .report-view,
        .pdf-temp-section .report-container {
          background: #F8FAFC !important;
          background-image: none !important;
          background-color: #F8FAFC !important;
        }
        
        /* Card styling with professional look */
        .pdf-temp-section .repo-card,
        .pdf-temp-section .metric-card,
        .pdf-temp-section .chart-card,
        .pdf-temp-section .roadmap-card,
        .pdf-temp-section .score-card {
          background: #FFFFFF !important;
          background-image: none !important;
          background-color: #FFFFFF !important;
          border: none !important; /* No border for a cleaner look */
          border-bottom: 3px solid #EEF2FF !important; /* Subtle bottom border - indigo-50 */
          color: #1E293B !important; /* Slate-800 for better contrast */
          padding: 30px !important; /* Increased padding */
          margin-bottom: 30px !important; /* More spacing between cards */
          box-shadow: 0 4px 12px rgba(0,0,0,0.05) !important; /* Enhanced shadow for depth */
          border-radius: 10px !important; /* Slightly more rounded corners */
          page-break-inside: avoid !important; /* Prevent cards from breaking across pages */
        }
        
        /* Text colors */
        .pdf-temp-section .report-title,
        .pdf-temp-section .header-title,
        .pdf-temp-section .landing-title {
          background: none !important;
          background-image: none !important;
          color: #1E40AF !important; /* Blue-800 */
          font-weight: 700 !important;
          -webkit-background-clip: unset !important;
          background-clip: unset !important;
          margin-bottom: 16px !important;
          letter-spacing: -0.01em !important;
        }
        
        /* Heading styles with professional typography */
        .pdf-temp-section h1 {
          color: #0F172A !important; /* slate-900 - darker for better print contrast */
          font-size: 32px !important;
          margin-bottom: 24px !important;
          letter-spacing: -0.02em !important;
          font-weight: 700 !important;
          line-height: 1.2 !important;
          border-bottom: 2px solid #E2E8F0 !important; /* subtle border */
          padding-bottom: 12px !important;
        }
        
        .pdf-temp-section h2 {
          color: #1E40AF !important; /* Blue-800 */
          font-size: 26px !important;
          margin-bottom: 20px !important;
          letter-spacing: -0.01em !important;
          font-weight: 600 !important;
          line-height: 1.3 !important;
        }
        
        .pdf-temp-section h3 {
          color: #1E3A8A !important; /* Blue-900 - darker for better print contrast */
          font-size: 22px !important;
          margin-bottom: 16px !important;
          font-weight: 600 !important;
          line-height: 1.4 !important;
          border-bottom: 1px solid #EDF2F7 !important; /* Very subtle bottom border */
          padding-bottom: 8px !important;
        }
        
        .pdf-temp-section h4 {
          color: #2563EB !important; /* Blue-600 */
          font-size: 18px !important;
          margin-bottom: 14px !important;
          font-weight: 600 !important;
          line-height: 1.4 !important;
        }
        
        /* Text content with improved readability */
        .pdf-temp-section p {
          color: #334155 !important; /* Slate-700 */
          line-height: 1.6 !important;
          margin-bottom: 16px !important;
        }
        
        .pdf-temp-section .info-label {
          color: #64748B !important; /* Slate-500 */
          font-weight: 500 !important;
          font-size: 14px !important;
        }
        
        .pdf-temp-section .info-value {
          color: #334155 !important; /* Slate-700 */
          font-weight: 600 !important;
        }
        
        /* Metric titles and values */
        .pdf-temp-section .metric-box-label {
          color: #64748B !important; /* Slate-500 */
          font-size: 14px !important;
          margin-bottom: 4px !important;
        }
        
        .pdf-temp-section .metric-box-value {
          color: #334155 !important; /* Slate-700 */
          font-weight: 700 !important;
          font-size: 20px !important;
        }
        
        /* Score elements with professional styling */
        .pdf-temp-section .score-circle,
        .pdf-temp-section .score-number {
          background: #4F46E5 !important; /* Indigo-600 */
          background-image: none !important;
          background-color: #4F46E5 !important;
          color: #FFFFFF !important;
          font-weight: bold !important;
          padding: 0 !important;
          border-radius: 50% !important;
          width: 80px !important; /* Even larger score circle */
          height: 80px !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          font-size: 32px !important;
          box-shadow: 0 8px 16px rgba(79, 70, 229, 0.25) !important;
          border: 4px solid #EEF2FF !important; /* Indigo-50 border */
          margin: 10px auto 15px auto !important; /* Center-aligned */
        }
        
        .pdf-temp-section .score-bar {
          background: #4F46E5 !important; /* Indigo-600 - matching the score circle */
          background-image: none !important;
          background-color: #4F46E5 !important;
          height: 12px !important; /* Even thicker for better visibility */
          border-radius: 6px !important;
          box-shadow: 0 2px 4px rgba(79, 70, 229, 0.2) !important;
          position: relative !important;
          overflow: visible !important;
        }
        
        /* Score bar container with grid marks */
        .pdf-temp-section .score-bar-container {
          position: relative !important;
          height: 25px !important; /* Taller to accommodate grid marks */
          margin: 15px 0 25px 0 !important;
          background: #F8FAFC !important; /* Very light background */
          border-radius: 6px !important;
          border: 1px solid #E2E8F0 !important;
        }
        
        /* Benchmark line with improved visibility */
        .pdf-temp-section .benchmark-line {
          position: absolute !important;
          top: -10px !important;
          bottom: -10px !important;
          width: 3px !important; /* Thicker line */
          background-color: #475569 !important; /* Slate-600 - darker for visibility */
          z-index: 2 !important;
        }
        
        /* Score colors with enhanced visual appeal */
        .pdf-temp-section .score-excellent {
          background: #059669 !important; /* Emerald-600 - slightly darker for better print */
          background-color: #059669 !important;
          box-shadow: 0 8px 16px rgba(5, 150, 105, 0.25) !important;
          border: 4px solid #D1FAE5 !important; /* Emerald-50 border */
        }
        
        .pdf-temp-section .score-good {
          background: #D97706 !important; /* Amber-600 - slightly darker for better print */
          background-color: #D97706 !important;
          box-shadow: 0 8px 16px rgba(217, 119, 6, 0.25) !important;
          border: 4px solid #FEF3C7 !important; /* Amber-50 border */
        }
        
        .pdf-temp-section .score-poor {
          background: #DC2626 !important; /* Red-600 - slightly darker for better print */
          background-color: #DC2626 !important;
          box-shadow: 0 8px 16px rgba(220, 38, 38, 0.25) !important;
          border: 4px solid #FEE2E2 !important; /* Red-50 border */
        }
        
        /* Charts and progress bars */
        .pdf-temp-section .progress,
        .pdf-temp-section .progress-bar {
          background: #3B82F6 !important; /* Blue-500 */
          background-image: none !important;
          background-color: #3B82F6 !important;
          height: 8px !important;
          border-radius: 4px !important;
        }
        
        /* Force canvas elements to have simple backgrounds */
        .pdf-temp-section canvas {
          background: #FFFFFF !important;
          max-width: 100% !important;
          border-radius: 4px !important;
          padding: 10px !important;
        }
        
        /* Remove all gradients and complex backgrounds */
        .pdf-temp-section * {
          background-image: none !important;
          background-attachment: unset !important;
          filter: none !important;
          backdrop-filter: none !important;
        }
        
        /* Table styles with professional design */
        .pdf-temp-section table {
          width: 100% !important;
          border-collapse: collapse !important;
          margin: 25px 0 35px 0 !important;
          border: none !important;
          box-shadow: 0 4px 12px rgba(0,0,0,0.08) !important;
          border-radius: 8px !important;
          overflow: hidden !important;
          page-break-inside: avoid !important; /* Prevent tables from breaking across pages */
        }
        
        .pdf-temp-section th {
          padding: 16px 20px !important;
          text-align: left !important;
          background-color: #EEF2FF !important; /* Indigo-50 - matching our color scheme */
          color: #1E3A8A !important; /* Blue-900 - darker for better print contrast */
          font-weight: 600 !important;
          font-size: 15px !important;
          border-bottom: 2px solid #C7D2FE !important; /* Indigo-200 */
          letter-spacing: 0.02em !important;
        }
        
        .pdf-temp-section td {
          padding: 14px 20px !important;
          text-align: left !important;
          border-bottom: 1px solid #E2E8F0 !important; /* Slate-200 */
          color: #1E293B !important; /* Slate-800 - for better readability */
          font-size: 14px !important;
          line-height: 1.5 !important;
        }
        
        /* Alternating row colors for better readability */
        .pdf-temp-section tr:nth-child(even) {
          background-color: #F8FAFC !important; /* Slate-50 */
        }
        
        /* List styles with professional design */
        .pdf-temp-section ul {
          padding-left: 28px !important;
          margin: 20px 0 30px 0 !important;
          list-style-type: none !important;
          position: relative !important;
        }
        
        .pdf-temp-section li {
          margin-bottom: 12px !important;
          color: #1E293B !important; /* Slate-800 - darker for readability */
          line-height: 1.6 !important;
          padding-left: 8px !important;
          position: relative !important;
        }
        
        /* Custom bullets for lists with accent color */
        .pdf-temp-section li:before {
          content: '' !important;
          position: absolute !important;
          left: -20px !important;
          top: 8px !important;
          width: 8px !important;
          height: 8px !important;
          background-color: #4F46E5 !important; /* Indigo-600 - matching our theme */
          border-radius: 50% !important;
        }
        
        /* Recommendations list styling */
        .pdf-temp-section .roadmap-list li {
          padding: 10px 5px 10px 10px !important;
          border-left: 3px solid #4F46E5 !important; /* Indigo accent */
          background-color: #F8FAFC !important; /* Very light background */
          border-radius: 0 4px 4px 0 !important;
          margin-bottom: 15px !important;
          box-shadow: 0 2px 4px rgba(0,0,0,0.05) !important;
        }
        
        .pdf-temp-section .roadmap-list li:before {
          content: none !important; /* Remove default bullet */
        }

        /* Section title with professional styling */
        .pdf-section-title {
          font-size: 22px !important;
          font-weight: bold !important;
          color: #1E3A8A !important; /* Blue-900 - darker for better print */
          border-bottom: 3px solid #C7D2FE !important; /* Indigo-200 */
          padding-bottom: 10px !important;
          margin-bottom: 25px !important;
          letter-spacing: -0.01em !important;
          text-transform: uppercase !important; /* For a more professional look */
          position: relative !important;
        }
        
        /* Add a smaller accent line under section titles */
        .pdf-section-title:after {
          content: '' !important;
          position: absolute !important;
          left: 0 !important;
          bottom: -3px !important;
          width: 60px !important;
          height: 3px !important;
          background-color: #4F46E5 !important; /* Indigo-600 - accent color */
        }
      `;
      document.head.appendChild(pdfSafeStyle);
      
      // Create a new jsPDF instance with higher quality settings
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true
      });
      
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 10; // 10mm margin
      const contentWidth = pageWidth - (margin * 2);
      
      // Helper function to render section to canvas with handling de métricas aprimorado
      const renderSectionToCanvas = async (element: HTMLElement, title = '') => {
        // Adiciona um delay para permitir que o DOM seja atualizado completamente
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // Criar container temporário com tamanho fixo para renderização consistente
        const tempContainer = document.createElement('div');
        tempContainer.className = 'pdf-temp-section';
        tempContainer.style.position = 'absolute';
        tempContainer.style.left = '-9999px';
        tempContainer.style.width = '800px'; // Largura fixa para escala consistente
        tempContainer.style.backgroundColor = '#FFFFFF';
        tempContainer.style.padding = '20px';
        document.body.appendChild(tempContainer);
        
        // Adicionar título se fornecido
        if (title) {
          const titleEl = document.createElement('h2');
          titleEl.className = 'pdf-section-title';
          titleEl.textContent = title;
          titleEl.style.fontSize = '18px';
          titleEl.style.fontWeight = 'bold';
          titleEl.style.marginBottom = '15px';
          titleEl.style.color = '#1E293B'; // slate-800
          tempContainer.appendChild(titleEl);
        }
        
        // Clonar o elemento para o container temporário
        const clonedElement = element.cloneNode(true) as HTMLElement;
        
        // Forçar dimensões e visual
        clonedElement.style.width = '100%';
        clonedElement.style.maxWidth = '100%';
        clonedElement.style.margin = '0';
        clonedElement.style.padding = '0';
        clonedElement.style.boxSizing = 'border-box';
        clonedElement.style.overflow = 'visible';
        
        // === MELHORIAS ESPECÍFICAS PARA CADA TIPO DE ELEMENTO ===
        
        // Corrigir caixas de métricas
        const metricBoxes = clonedElement.querySelectorAll('.metric-box, .score-display, .chart-card, .score-card');
        metricBoxes.forEach((box) => {
          const boxEl = box as HTMLElement;
          boxEl.style.padding = '15px';
          boxEl.style.margin = '10px 0';
          boxEl.style.border = '1px solid #E2E8F0';
          boxEl.style.borderRadius = '8px';
          boxEl.style.backgroundColor = '#FFFFFF';
          boxEl.style.boxShadow = '0 2px 4px rgba(0,0,0,0.05)';
          boxEl.style.width = '100%';
          boxEl.style.maxWidth = '100%';
          boxEl.style.boxSizing = 'border-box';
          boxEl.style.display = 'block';
        });
        
        // Corrigir elementos de pontuação
        const scoreElements = clonedElement.querySelectorAll('.score-number, .score-circle, .metric-number');
        scoreElements.forEach((score) => {
          const scoreEl = score as HTMLElement;
          scoreEl.style.display = 'flex';
          scoreEl.style.alignItems = 'center';
          scoreEl.style.justifyContent = 'center';
          scoreEl.style.fontWeight = 'bold';
          scoreEl.style.fontSize = '26px';
          scoreEl.style.width = '70px';
          scoreEl.style.height = '70px';
          scoreEl.style.borderRadius = '50%';
          scoreEl.style.margin = '10px auto';
          scoreEl.style.position = 'relative';
          
          // Extrair valor numérico se possível
          let value = 0;
          try {
            value = parseInt(scoreEl.textContent?.replace(/\D/g, '') || '0', 10);
          } catch (e) {
            console.warn('Não foi possível extrair valor numérico:', e);
          }
          
          // Aplicar cores com base no valor
          if (value >= 80 || scoreEl.classList.contains('score-excellent')) {
            scoreEl.style.backgroundColor = '#059669'; // Emerald-600
            scoreEl.style.color = '#FFFFFF';
          } else if (value >= 60 || scoreEl.classList.contains('score-good')) {
            scoreEl.style.backgroundColor = '#D97706'; // Amber-600
            scoreEl.style.color = '#FFFFFF';
          } else {
            scoreEl.style.backgroundColor = '#DC2626'; // Red-600
            scoreEl.style.color = '#FFFFFF';
          }
          
          // Adicionar texto explicativo ao lado se não existir
          if (!scoreEl.nextElementSibling) {
            const label = document.createElement('div');
            label.style.marginTop = '5px';
            label.style.textAlign = 'center';
            label.style.fontSize = '12px';
            label.style.color = '#4B5563'; // gray-600
            label.textContent = value >= 80 ? 'Excelente' : value >= 60 ? 'Bom' : 'Precisa Melhorar';
            scoreEl.parentNode?.appendChild(label);
          }
        });
        
        // Corrigir tabelas
        const tables = clonedElement.querySelectorAll('table');
        tables.forEach((table) => {
          const tableEl = table as HTMLElement;
          tableEl.style.width = '100%';
          tableEl.style.borderCollapse = 'collapse';
          tableEl.style.marginBottom = '20px';
          tableEl.style.fontSize = '14px';
          tableEl.style.border = '1px solid #E2E8F0';
          
          const cells = table.querySelectorAll('th, td');
          cells.forEach((cell) => {
            const cellEl = cell as HTMLElement;
            cellEl.style.padding = '10px';
            cellEl.style.border = '1px solid #E2E8F0';
            cellEl.style.textAlign = 'left';
          });
          
          const headings = table.querySelectorAll('th');
          headings.forEach((heading) => {
            const headingEl = heading as HTMLElement;
            headingEl.style.backgroundColor = '#F1F5F9';
            headingEl.style.color = '#334155';
            headingEl.style.fontWeight = 'bold';
          });
        });
        
        // Corrigir gráficos (canvas) e seus containers
        const chartContainers = clonedElement.querySelectorAll('.chart-container, [data-type="chart"]');
        chartContainers.forEach((chart) => {
          const chartEl = chart as HTMLElement;
          chartEl.style.width = '100%';
          chartEl.style.height = '250px';
          chartEl.style.maxWidth = '500px';
          chartEl.style.margin = '15px auto';
          chartEl.style.position = 'relative';
          chartEl.style.display = 'block';
          
          // Forçar canvas interno para ser visível
          const canvas = chartEl.querySelector('canvas');
          if (canvas instanceof HTMLElement) {
            canvas.style.width = '100%';
            canvas.style.height = '100%';
            canvas.style.display = 'block';
          }
        });
        
        // Tratamento específico para o gráfico de distribuição de linguagens
        const languagesChart = clonedElement.querySelector('.languages-chart, [data-chart-type="languages"]');
        if (languagesChart instanceof HTMLElement) {
          // Forçar dimensões e visibilidade para o gráfico de linguagens
          languagesChart.style.width = '100%';
          languagesChart.style.height = '300px';
          languagesChart.style.maxWidth = '100%';
          languagesChart.style.margin = '20px auto';
          languagesChart.style.display = 'block';
          languagesChart.style.position = 'relative';
          languagesChart.style.overflow = 'visible';
          
          // Buscar todos os elementos dentro do gráfico de linguagens
          const chartElements = languagesChart.querySelectorAll('*');
          chartElements.forEach((element) => {
            if (element instanceof HTMLElement) {
              // Garantir que todos os elementos estejam visíveis
              element.style.visibility = 'visible';
              element.style.display = element.tagName.toLowerCase() === 'canvas' ? 'block' : '';
              element.style.opacity = '1';
            }
          });
          
          // Se houver uma legenda de linguagens, garantir que seja visível
          const legendElements = clonedElement.querySelectorAll('.language-legend, .chart-legend');
          legendElements.forEach((legend) => {
            if (legend instanceof HTMLElement) {
              legend.style.display = 'block';
              legend.style.margin = '10px auto';
              legend.style.padding = '10px';
              legend.style.backgroundColor = '#F8FAFC';
              legend.style.border = '1px solid #E2E8F0';
              legend.style.borderRadius = '4px';
              
              // Garantir que os itens da legenda sejam visíveis
              const legendItems = legend.querySelectorAll('li, .legend-item');
              legendItems.forEach((item) => {
                if (item instanceof HTMLElement) {
                  item.style.display = 'flex';
                  item.style.alignItems = 'center';
                  item.style.margin = '5px 0';
                  item.style.fontSize = '12px';
                  
                  // Garantir que as cores da legenda sejam visíveis
                  const colorMarker = item.querySelector('.color-marker, [data-color-marker]');
                  if (colorMarker instanceof HTMLElement) {
                    colorMarker.style.width = '12px';
                    colorMarker.style.height = '12px';
                    colorMarker.style.display = 'inline-block';
                    colorMarker.style.marginRight = '5px';
                    colorMarker.style.borderRadius = '2px';
                  }
                }
              });
            }
          });
        }
        
        // Adicionar elemento clonado ao container
        tempContainer.appendChild(clonedElement);
        
        // Permitir que o DOM seja atualizado
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Tornar o container visível para capturar corretamente
        tempContainer.style.visibility = 'visible';
        tempContainer.style.zIndex = '-1'; // Abaixo de tudo, mas visível para renderização
        
        // Configurações mais eficazes para a captura do canvas
        const canvas = await html2canvas(tempContainer, {
          scale: 2.5, // Escala maior para melhor qualidade
          logging: false,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#FFFFFF',
          ignoreElements: (el: Element) => el.tagName === 'BUTTON',
          onclone: (doc: Document, elem: HTMLElement) => {
            // Garantir que tudo esteja visível
            const allElements = elem.querySelectorAll('*');
            allElements.forEach((el: Element) => {
              if (el instanceof HTMLElement) {
                // Corrigir elementos ocultos
                if (window.getComputedStyle(el).display === 'none') {
                  el.style.display = 'block';
                }
                if (window.getComputedStyle(el).visibility === 'hidden') {
                  el.style.visibility = 'visible';
                }
                if (window.getComputedStyle(el).opacity === '0') {
                  el.style.opacity = '1';
                }
              }
            });
            
            // Forçar renderização completa
            const chartElements = elem.querySelectorAll('.chart-container, canvas');
            chartElements.forEach((chart: Element) => {
              if (chart instanceof HTMLElement) {
                // Garantir que canvas de gráficos estejam bem visíveis
                chart.style.visibility = 'visible';
                chart.style.display = 'block';
                chart.style.opacity = '1';
              }
            });
          }
        });
        
        // Limpar
        try {
          document.body.removeChild(tempContainer);
        } catch (e) {
          console.warn('Erro ao remover container temporário:', e);
        }
        
        return canvas;
      };
      
      // Função para adicionar cabeçalho com gradiente na primeira página
      const addFirstPageHeader = () => {
        // Criar um gradiente moderno
        // Indigo-600 para Indigo-900
        let fillOpacity = 1;
        
        // Desenhar o fundo do cabeçalho com gradiente manual
        doc.setFillColor(79, 70, 229); // indigo-600
        doc.rect(0, 0, pageWidth, 40, 'F');
        
        // Adicionar uma sobreposição de gradiente
        for (let y = 0; y < 40; y += 2) {
          fillOpacity = 1 - (y / 80); // Diminuir opacidade gradualmente
          doc.setFillColor(67, 56, 202, fillOpacity); // indigo-700 com opacidade variável
          doc.rect(0, y, pageWidth, 2, 'F');
        }
        
        // Adicionar decoração com linhas
        doc.setDrawColor(255, 255, 255, 0.6);
        doc.setLineWidth(0.8);
        doc.line(15, 38, pageWidth - 15, 38);
        
        // Adicionar uma linha fina de destaque
        doc.setDrawColor(224, 231, 255, 0.8); // indigo-100 com transparência
        doc.setLineWidth(0.3);
        doc.line(15, 36, pageWidth - 15, 36);
      };
      
      // Criar uma página de capa profissional para investidores
      // Fundo gradiente para a capa
      const createCoverPage = () => {
        // Fundo com gradiente
        doc.setFillColor(79, 70, 229); // indigo-600
        doc.rect(0, 0, pageWidth, pageHeight, 'F');
        
        // Adicionar uma textura sutil
        for (let y = 0; y < pageHeight; y += 10) {
          doc.setFillColor(67, 56, 202, 0.2); // indigo-700 com transparência
          doc.rect(0, y, pageWidth, 5, 'F');
        }
        
        // Adicionar um elemento gráfico - caixa de destaque para o título
        doc.setFillColor(255, 255, 255, 0.1);
        doc.roundedRect(margin, 70, pageWidth - (margin * 2), 100, 3, 3, 'F');
        
        // Adicionar elementos decorativos
        doc.setDrawColor(255, 255, 255, 0.3);
        doc.setLineWidth(1);
        doc.line(margin, 80, pageWidth - margin, 80);
        doc.line(margin, 160, pageWidth - margin, 160);
        
        // Adicionar o título principal com tipografia elegante
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(36);
        doc.text('TECH HEALTH APPENDIX', pageWidth / 2, 110, { align: 'center' });
        
        // Adicionar subtítulo
        doc.setFontSize(16);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(224, 231, 255); // indigo-100
        doc.text('Análise Técnica para Investidores', pageWidth / 2, 130, { align: 'center' });
        
        // Adicionar informações do repositório
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(20);
        doc.text(`${report.repository.full_name}`, pageWidth / 2, 190, { align: 'center' });
        
        // Adicionar informações da empresa e documento
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(12);
        doc.text(`Preparado para: Diligência Técnica - Série A`, pageWidth / 2, 210, { align: 'center' });
        
        // Adicionar data de geração e avisos de confidencialidade
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(10);
        doc.setTextColor(224, 231, 255); // indigo-100
        doc.text(`Documento Confidencial`, pageWidth / 2, 225, { align: 'center' });
        doc.text(`Gerado em: ${formattedDate}`, pageWidth / 2, 235, { align: 'center' });
        
        // Adicionar rodapé na capa
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.text('Tech Health Appendix Generator', pageWidth / 2, pageHeight - 20, { align: 'center' });
      };
      
      // Aplicar a capa
      createCoverPage();
      
      // Adicionar uma segunda página para o conteúdo principal
      doc.addPage();
      
      // Aplicar o cabeçalho da página de conteúdo
      addFirstPageHeader();
      
      // Adicionar o título da página de conteúdo
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(24);
      doc.text('ANÁLISE TÉCNICA', pageWidth / 2, 22, { align: 'center' });
      
      // Adicionar subtítulo
      doc.setFontSize(14);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(224, 231, 255); // indigo-100
      doc.text('Métricas e Avaliação de Qualidade', pageWidth / 2, 32, { align: 'center' });
      
      // Adicionar informações do repositório
      doc.setTextColor(15, 23, 42); // slate-900
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.text(`Repositório: ${report.repository.full_name}`, pageWidth / 2, 55, { align: 'center' });
      
      // Adicionar resumo executivo - investidores adoram isto
      doc.setFillColor(248, 250, 252); // slate-50
      doc.roundedRect(margin, 75, pageWidth - (margin * 2), 40, 3, 3, 'F');
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(15, 23, 42); // slate-900
      doc.text('RESUMO EXECUTIVO', margin + 10, 85);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(51, 65, 85); // slate-700
      doc.text(
        `Este relatório apresenta uma avaliação técnica do código-fonte com pontuação geral de ${report.overallScore}/100, ` +
        `${report.overallScore > report.benchmarkScore ? 'acima' : 'abaixo'} da média do setor de ${report.benchmarkScore}/100. ` +
        `Fornece análise de qualidade de código, débito técnico e métricas de implantação.`,
        margin + 10, 95, { maxWidth: pageWidth - (margin * 2) - 20 }
      );
      
      // Definir a posição inicial Y para o conteúdo principal
      let yPos = 130;
      
      try {
        if (report.repository.owner.avatar_url) {
          const img = document.createElement('img') as HTMLImageElement;
          img.crossOrigin = 'Anonymous';
          await new Promise<void>((resolve, reject) => {
            img.onload = () => resolve();
            img.onerror = (e) => reject(e instanceof Event ? e : new Error('Failed to load image'));
            img.src = report.repository.owner.avatar_url;
          });
          
          // Adicionar avatar no canto superior direito do resumo executivo
          doc.addImage(img, 'PNG', pageWidth - margin - 30, 75, 25, 25);
        }
      } catch (error) {
        console.warn('Could not add avatar image', error);
      }
      
      // Helper function to add a new page if needed
      const checkPageBreak = (requiredHeight: number) => {
        if (yPos + requiredHeight + margin > pageHeight) {
          doc.addPage();
          yPos = margin;
          
          // Adicionar cabeçalho nas páginas subsequentes
          // Usar um design mais sutil que o da primeira página
          doc.setFillColor(79, 70, 229); // indigo-600
          doc.rect(0, 0, pageWidth, 22, 'F');
          
          // Adicionar uma sobrecamada para dar efeito de gradiente
          doc.setFillColor(67, 56, 202, 0.4); // indigo-700 com transparência
          doc.rect(0, 0, pageWidth, 22, 'F');
          
          // Adicionar linha decorativa
          doc.setDrawColor(255, 255, 255, 0.7);
          doc.setLineWidth(0.4);
          doc.line(margin, 20, pageWidth - margin, 20);
          
          // Adicionar informações do repositório no cabeçalho
          doc.setTextColor(255, 255, 255);
          doc.setFontSize(12);
          doc.setFont('helvetica', 'bold');
          doc.text(`TECH HEALTH APPENDIX`, margin, 14);
          
          // Adicionar nome do repositório à direita
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(10);
          doc.text(`${report.repository.name}`, pageWidth - margin, 14, { align: 'right' });
          
          // Adicionar um elemento decorativo
          doc.setDrawColor(224, 231, 255, 0.6); // indigo-100 com transparência
          doc.circle(pageWidth / 2, 11, 2, 'S');
          
          yPos += 30; // Mais espaço após o cabeçalho
        }
      };
      
      // Melhorar a renderização de métricas
      const prepareMetricsForPdf = (element: HTMLElement) => {
        // Garantir que números de métricas sejam visíveis
        const metricNumbers = element.querySelectorAll('.score-number, .metric-number, .score-circle');
        metricNumbers.forEach((metric) => {
          if (metric instanceof HTMLElement) {
            metric.style.fontSize = '24px';
            metric.style.fontWeight = 'bold';
            metric.style.textAlign = 'center';
            metric.style.display = 'flex';
            metric.style.alignItems = 'center';
            metric.style.justifyContent = 'center';
            
            // Forçar cores adequadas com base no valor
            const value = parseInt(metric.textContent || '0', 10);
            if (value >= 80) {
              metric.style.color = '#059669'; // emerald-600
              metric.style.backgroundColor = '#D1FAE5'; // emerald-100
            } else if (value >= 60) {
              metric.style.color = '#D97706'; // amber-600
              metric.style.backgroundColor = '#FEF3C7'; // amber-100
            } else {
              metric.style.color = '#DC2626'; // red-600
              metric.style.backgroundColor = '#FEE2E2'; // red-100
            }
          }
        });
        
        // Garantir que gráficos sejam visíveis
        const charts = element.querySelectorAll('.chart-container, canvas');
        charts.forEach((chart) => {
          if (chart instanceof HTMLElement) {
            chart.style.width = '100%';
            chart.style.maxWidth = '400px';
            chart.style.height = '200px';
            chart.style.margin = '0 auto';
            chart.style.display = 'block';
          }
        });
      };
      
      // Helper function to add section image with proper scaling
      const addSectionImage = async (element: Element | null, title = '', addPageBreak = false) => {
        if (!element) return;
        
        // Check if we need a page break before this section
        if (addPageBreak) {
          doc.addPage();
          yPos = margin + 10;
        }
        
        // Preparar métricas para melhor renderização no PDF
        if (element instanceof HTMLElement) {
          prepareMetricsForPdf(element);
        }
        
        // Render section to canvas
        const canvas = await renderSectionToCanvas(element as HTMLElement, title);
        
        // Calculate dimensions to fit page width
        const imgWidth = contentWidth;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        
        // Check if we need a page break
        checkPageBreak(imgHeight + 15);
        
        // Add section title
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(16);
        doc.setTextColor(51, 65, 85); // slate-700
        doc.text(title, margin, yPos + 10);
        yPos += 15;
        
        // Add image
        doc.addImage(
          canvas.toDataURL('image/png'),
          'PNG',
          margin,
          yPos,
          imgWidth,
          imgHeight
        );
        
        // Update position
        yPos += imgHeight + 15;
        
        // Add a subtle separator line between sections (except before page breaks)
        if (yPos + 10 < pageHeight) {
          doc.setDrawColor(226, 232, 240); // slate-200
          doc.setLineWidth(0.5);
          doc.line(margin * 3, yPos - 10, pageWidth - (margin * 3), yPos - 10);
        }
      };
      
      // Add repository info section - with extra space as it's a major section
      await addSectionImage(repoCard, 'Repository Overview', true);
      
      // Add score cards (one by one for better page breaking)
      for (let i = 0; i < scoreCards.length; i++) {
        const scoreCard = scoreCards[i];
        const title = scoreCard.querySelector('h3')?.textContent || `Metric ${i+1}`;
        // Add extra space for the first score card only
        await addSectionImage(scoreCard, title, i === 0);
      }
      
      // Método especial para renderizar o gráfico de distribuição de linguagens diretamente no PDF
      const renderLanguageDistribution = async () => {
        try {
          // Encontrar os dados de linguagens a partir do estado global ou elementos DOM
          const languageItems = document.querySelectorAll('.language-item, .language-list li');
          if (!languageItems || languageItems.length === 0) {
            console.warn('Dados de linguagens não encontrados no DOM');
            return;
          }
          
          // Extrair dados de linguagens
          const languageData: {name: string; color: string; percentage: number}[] = [];
          
          languageItems.forEach((item) => {
            try {
              const name = item.querySelector('.language-name')?.textContent || '';
              const percentText = item.querySelector('.language-percent')?.textContent || '';
              const percentage = parseFloat(percentText.replace('%', '')) || 0;
              
              // Extrair cor (pode estar em um elemento span com background-color)
              let color = '#4F46E5'; // indigo-600 padrão
              const colorEl = item.querySelector('.color-dot, .language-color, [data-color]');
              if (colorEl instanceof HTMLElement) {
                // Tentar obter a cor do elemento
                const computedStyle = window.getComputedStyle(colorEl);
                const bgColor = computedStyle.backgroundColor || computedStyle.background;
                if (bgColor && bgColor !== 'transparent' && bgColor !== 'rgba(0, 0, 0, 0)') {
                  color = bgColor;
                }
              }
              
              if (name && percentage > 0) {
                languageData.push({ name, color, percentage });
              }
            } catch (e) {
              console.error('Erro ao extrair dados de linguagem:', e);
            }
          });
          
          // Se não tiver dados suficientes, pular
          if (languageData.length === 0) {
            console.warn('Sem dados suficientes para renderizar o gráfico de linguagens');
            return;
          }
          
          // Ordenar por porcentagem (do maior para o menor)
          languageData.sort((a, b) => b.percentage - a.percentage);
          
          // Adicionar página dedicada para o gráfico de linguagens
          doc.addPage();
          yPos = margin + 10;
          
          // Adicionar título destacado
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(18);
          doc.setTextColor(79, 70, 229); // indigo-600
          doc.text('DISTRIBUIÇÃO DE LINGUAGENS', pageWidth / 2, yPos, { align: 'center' });
          yPos += 25;
          
          // Configurar dimensões do gráfico
          const chartWidth = contentWidth - 40;
          const chartHeight = 60 + (languageData.length * 30); // Altura dinâmica baseada no número de linguagens
          const chartX = margin + 20;
          const chartY = yPos;
          
          // Desenhar fundo do gráfico
          doc.setFillColor(248, 250, 252); // slate-50
          doc.roundedRect(chartX, chartY, chartWidth, chartHeight, 3, 3, 'F');
          
          // Adicionar borda
          doc.setDrawColor(226, 232, 240); // slate-200
          doc.setLineWidth(0.5);
          doc.roundedRect(chartX, chartY, chartWidth, chartHeight, 3, 3, 'S');
          
          // Adicionar título do gráfico
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(14);
          doc.setTextColor(15, 23, 42); // slate-900
          doc.text('Distribuição de Linguagens de Programação', chartX + chartWidth/2, chartY + 15, { align: 'center' });
          
          // Definir posição inicial para as barras
          let barY = chartY + 35;
          const barHeight = 20;
          const textX = chartX + 10;
          const barX = textX + 100; // Posição inicial da barra
          const maxBarWidth = chartWidth - 120 - 50; // Espaço para texto e porcentagem
          
          // Renderizar cada linguagem como uma barra horizontal
          languageData.forEach((lang) => {
            // Texto da linguagem
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(12);
            doc.setTextColor(51, 65, 85); // slate-700
            doc.text(lang.name, textX, barY + barHeight/2);
            
            // Converter cor hexadecimal ou RGB para componentes RGB
            let r = 79, g = 70, b = 229; // indigo-600 padrão
            
            try {
              // Tentar extrair valores RGB da cor
              if (lang.color.startsWith('#')) {
                // Cor hexadecimal
                const hex = lang.color.substring(1);
                r = parseInt(hex.substring(0, 2), 16);
                g = parseInt(hex.substring(2, 4), 16);
                b = parseInt(hex.substring(4, 6), 16);
              } else if (lang.color.startsWith('rgb')) {
                // Cor RGB
                const rgbValues = lang.color.match(/\d+/g);
                if (rgbValues && rgbValues.length >= 3) {
                  r = parseInt(rgbValues[0]);
                  g = parseInt(rgbValues[1]);
                  b = parseInt(rgbValues[2]);
                }
              }
            } catch (e) {
              console.warn('Erro ao processar cor:', e);
            }
            
            // Desenhar a barra com a cor da linguagem
            doc.setFillColor(r, g, b);
            const barWidthPercentage = lang.percentage / 100;
            const barWidth = maxBarWidth * barWidthPercentage;
            doc.roundedRect(barX, barY - barHeight/2, barWidth, barHeight, 2, 2, 'F');
            
            // Adicionar porcentagem ao final da barra
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(11);
            doc.setTextColor(15, 23, 42); // slate-900
            doc.text(
              `${lang.percentage.toFixed(1)}%`,
              barX + barWidth + 10,
              barY + barHeight/2
            );
            
            // Avançar para a próxima barra
            barY += barHeight + 10;
          });
          
          // Atualizar posição Y
          yPos = barY + 20;
          
          // Adicionar texto explicativo
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(11);
          doc.setTextColor(71, 85, 105); // slate-600
          doc.text(
            'Este gráfico mostra a distribuição percentual das principais linguagens de programação utilizadas no projeto.\n' +
            'A identificação das linguagens é baseada na extensão dos arquivos e no conteúdo dos mesmos.',
            pageWidth / 2,
            yPos,
            { align: 'center', maxWidth: contentWidth - 40 }
          );
          
        } catch (error) {
          console.error('Erro ao renderizar gráfico de linguagens:', error);
        }
      };
      
      // Executar o método especial para o gráfico de linguagens
      await renderLanguageDistribution();
      
      // Identificar o gráfico de linguagens para evitar duplicação
      const languagesChartElement = document.querySelector('.languages-chart, [data-chart-type="languages"]')?.closest('.chart-card');
      
      // Adicionar os demais gráficos
      for (let i = 0; i < chartCards.length; i++) {
        const chartCard = chartCards[i];
        // Pular o gráfico de linguagens que já foi adicionado separadamente
        if (languagesChartElement && chartCard === languagesChartElement) continue;
        
        // Tentar identificar o tipo de gráfico pelo título ou conteúdo
        let title = chartCard.querySelector('h3')?.textContent || '';
        if (!title) {
          // Tentar encontrar outros indicadores do tipo de gráfico
          if (chartCard.querySelector('[data-chart-type="commit-frequency"], .commit-frequency-chart')) {
            title = 'Frequência de Commits';
          } else if (chartCard.querySelector('[data-chart-type="contributors"], .contributors-chart')) {
            title = 'Contribuidores';
          } else {
            title = `Gráfico ${i+1}`;
          }
        }
        
        // Adicionar uma página para cada gráfico importante
        await addSectionImage(chartCard, title, true);
      }
      
      // Add roadmap section - with extra space as it's a major section
      if (roadmapCard) {
        await addSectionImage(roadmapCard, 'Optimization Roadmap', true);
      }
      
      // Adicionar rodapé profissional com paginação e informações para investidores
      // @ts-expect-error - A API interna do jsPDF existe mas não está tipada corretamente
      const totalPages = doc.internal.getNumberOfPages();
      
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        
        // Adicionar fundo sutil ao rodapé
        doc.setFillColor(248, 250, 252); // slate-50
        doc.rect(0, pageHeight - 20, pageWidth, 20, 'F');
        
        // Adicionar linha separadora no rodapé
        doc.setDrawColor(226, 232, 240); // slate-200
        doc.setLineWidth(0.5);
        doc.line(margin, pageHeight - 18, pageWidth - margin, pageHeight - 18);
        
        // Adicionar número da página com design melhorado
        doc.setFontSize(9);
        doc.setTextColor(100, 116, 139); // slate-500
        doc.setFont('helvetica', 'normal');
        doc.text(
          `Página ${i} de ${totalPages}`,
          pageWidth / 2,
          pageHeight - 8,
          { align: 'center' }
        );
        
        // Adicionar informação de confidencialidade (importante para documentos para investidores)
        doc.setFontSize(8);
        doc.setTextColor(100, 116, 139); // slate-500
        doc.setFont('helvetica', 'italic');
        doc.text(
          'Confidencial - Para uso exclusivo de investidores',
          margin,
          pageHeight - 8
        );
        
        // Adicionar data de geração à direita
        doc.setFont('helvetica', 'normal');
        doc.text(
          `Gerado em ${formattedDate}`,
          pageWidth - margin,
          pageHeight - 8,
          { align: 'right' }
        );
      }
      
      // Clean up
      const cssElement = document.getElementById('pdf-safe-css');
      if (cssElement) {
        document.head.removeChild(cssElement);
      }
      
      // Save PDF with higher quality
      doc.save(`TechHealthAppendix-${report.repository.name}-${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('Error exporting PDF:', error);
      alert('Failed to export PDF. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="report-view">
      <div className="report-container">
        <div className="report-header">
          <div className="report-title-section">
            <h1 className="report-title">Tech Health Appendix</h1>
            <p className="report-subtitle">Generated on {formattedDate}</p>
          </div>
          <div className="report-actions">
            <button
              onClick={exportAsPDF}
              disabled={isExporting}
              className="btn-primary"
            >
              {isExporting ? (
                <>
                  <svg className="loading-spinner mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Exporting...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Export as PDF
                </>
              )}
            </button>
            <button
              onClick={onReset}
              className="btn-secondary"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0V9a8 8 0 1115.357 2m-15.357-2H15" />
              </svg>
              Analyze Another Repository
            </button>
          </div>
        </div>

        <div className="repo-card">
          <div className="repo-header">
            <Image 
              src={report.repository.owner.avatar_url} 
              alt={report.repository.owner.login}
              className="repo-avatar"
              width={50}
              height={50}
            />
            <div className="flex-1">
              <h2 className="repo-name">{report.repository.full_name}</h2>
              <p className="repo-description">{report.repository.description || 'No description available'}</p>
            </div>
          </div>
          
          <div className="repo-info-grid">
            <div className="info-section">
              <h3 className="info-title">Repository Information</h3>
              <div className="info-grid">
                <div className="info-label">Created</div>
                <div className="info-value">{new Date(report.repository.created_at).toLocaleDateString()}</div>
                
                <div className="info-label">Last Updated</div>
                <div className="info-value">{new Date(report.repository.updated_at).toLocaleDateString()}</div>
                
                <div className="info-label">Primary Language</div>
                <div className="info-value">{report.repository.language || 'Not specified'}</div>
                
                <div className="info-label">Size</div>
                <div className="info-value">{(report.repository.size / 1024).toFixed(2)} MB</div>
              </div>
            </div>
            
            <div className="info-section">
              <h3 className="info-title">Overall Health Score</h3>
              <div className="score-display">
                <div className={`score-number ${getScoreColorClass(report.overallScore)}`}>
                  {report.overallScore}
                </div>
                <div className="score-details">
                  <p className="score-text">
                    Your score is <span className="font-semibold">{report.overallScore > report.benchmarkScore ? 'above' : 'below'}</span> the industry average of {report.benchmarkScore}.
                  </p>
                  <div className="score-bar-container">
                    <div 
                      className="score-bar"
                      style={{ width: `${report.overallScore}%` }}
                    ></div>
                    <div 
                      className="benchmark-line"
                      style={{ left: `${report.benchmarkScore}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div id="report-container" className="space-y-10">
          <div className="cards-grid">
            <ScoreCard
              title="Code Quality"
              score={report.codeQuality.score}
              metrics={[
                { label: 'Critical Issues', value: report.codeQuality.issues.critical },
                { label: 'High Issues', value: report.codeQuality.issues.high },
                { label: 'Medium Issues', value: report.codeQuality.issues.medium },
                { label: 'Low Issues', value: report.codeQuality.issues.low },
              ]}
              recommendations={report.codeQuality.recommendations}
            />
            
            <ScoreCard
              title="Technical Debt"
              score={report.technicalDebt.score}
              metrics={[
                { label: 'Complexity Score', value: report.technicalDebt.metrics.complexityScore },
                { label: 'Duplications', value: `${report.technicalDebt.metrics.duplications}%` },
                { label: 'Test Coverage', value: `${report.technicalDebt.metrics.testCoverage}%` },
                { label: 'Outdated Dependencies', value: report.technicalDebt.metrics.outdatedDependencies },
              ]}
              recommendations={report.technicalDebt.recommendations}
            />
            
            <ScoreCard
              title="Deployment Metrics"
              score={report.deploymentMetrics.score}
              metrics={[
                { label: 'Deployment Frequency', value: `${report.deploymentMetrics.frequency}/week` },
                { label: 'Lead Time', value: `${report.deploymentMetrics.leadTime} hours` },
                { label: 'Change Failure Rate', value: `${report.deploymentMetrics.changeFailureRate}%` },
                { label: 'Mean Time to Recover', value: `${report.deploymentMetrics.meanTimeToRecover} hours` },
              ]}
              recommendations={report.deploymentMetrics.recommendations}
            />
          </div>
          
          <div className="charts-grid">
            <div className="chart-card">
              <h3 className="chart-title">Code Metrics</h3>
              <div className="code-metrics-grid">
                <div className="metric-box">
                  <div className="metric-box-label">Total Lines</div>
                  <div className="metric-box-value">{report.codeMetrics.totalLines.toLocaleString()}</div>
                </div>
                <div className="metric-box">
                  <div className="metric-box-label">Code Lines</div>
                  <div className="metric-box-value">{report.codeMetrics.codeLines.toLocaleString()}</div>
                </div>
                <div className="metric-box">
                  <div className="metric-box-label">Comment Lines</div>
                  <div className="metric-box-value">{report.codeMetrics.commentLines.toLocaleString()}</div>
                </div>
                <div className="metric-box">
                  <div className="metric-box-label">Files</div>
                  <div className="metric-box-value">{report.codeMetrics.files.toLocaleString()}</div>
                </div>
              </div>
              
              <div className="languages-section">
                <h4 className="languages-title">Languages Distribution</h4>
                <LanguageChart languages={report.codeMetrics.languages} />
              </div>
            </div>
            
            <div className="chart-card">
              <h3 className="chart-title">Score Comparison</h3>
              <ScoreRadar
                codeQualityScore={report.codeQuality.score}
                technicalDebtScore={report.technicalDebt.score}
                deploymentScore={report.deploymentMetrics.score}
                benchmarkScore={report.benchmarkScore}
              />
            </div>
          </div>
          
          <div className="roadmap-card">
            <h3 className="roadmap-title">Optimization Roadmap</h3>
            <div className="roadmap-grid">
              <div className="roadmap-immediate">
                <div className="roadmap-section">
                  <h4 className="roadmap-section-title">
                    <svg className="w-6 h-6 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Immediate Actions
                  </h4>
                  <ul className="roadmap-list">
                    {report.codeQuality.recommendations.slice(0, 2).map((rec, index) => (
                      <li key={`imm-${index}`}>{rec}</li>
                    ))}
                    {report.technicalDebt.recommendations.slice(0, 1).map((rec, index) => (
                      <li key={`imm-td-${index}`}>{rec}</li>
                    ))}
                  </ul>
                </div>
              </div>
              
              <div className="roadmap-short">
                <div className="roadmap-section">
                  <h4 className="roadmap-section-title">
                    <svg className="w-6 h-6 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Short-term (2-4 weeks)
                  </h4>
                  <ul className="roadmap-list">
                    {report.deploymentMetrics.recommendations.slice(0, 1).map((rec, index) => (
                      <li key={`short-${index}`}>{rec}</li>
                    ))}
                    {report.technicalDebt.recommendations.slice(1, 3).map((rec, index) => (
                      <li key={`short-td-${index}`}>{rec}</li>
                    ))}
                  </ul>
                </div>
              </div>
              
              <div className="roadmap-long">
                <div className="roadmap-section">
                  <h4 className="roadmap-section-title">
                    <svg className="w-6 h-6 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Long-term (1-3 months)
                  </h4>
                  <ul className="roadmap-list">
                    {report.deploymentMetrics.recommendations.slice(1, 3).map((rec, index) => (
                      <li key={`long-${index}`}>{rec}</li>
                    ))}
                    {report.codeQuality.recommendations.slice(2, 3).map((rec, index) => (
                      <li key={`long-cq-${index}`}>{rec}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
