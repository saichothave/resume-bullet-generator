document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('resumeForm');
  const fileInput = document.getElementById('resumeUpload');
  const jobTitleInput = document.getElementById('jobTitle');
  const jobDescInput = document.getElementById('jobDescription');
  const analyzeBtn = document.getElementById('analyzeBtn');
  const fileNameDisplay = document.getElementById('fileName');
  const analysisContainer = document.getElementById('analysis-container');
  const chartCanvas = document.getElementById('analysisChart');

  let chartInstance = null;

  fileInput.addEventListener('change', () => {
    const file = fileInput.files[0];
    fileNameDisplay.textContent = file ? `Selected file: ${file.name}` : '';
    analyzeBtn.disabled = !file;
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const file = fileInput.files[0];
    const jobTitle = jobTitleInput.value.trim();
    const jobDesc = jobDescInput.value.trim();

    if (!file || !jobTitle || !jobDesc) {
      alert('Please fill out all fields and select a resume.');
      return;
    }

    const formData = new FormData();
    formData.append('resume', file);
    formData.append('job_title', jobTitle);
    formData.append('job_description', jobDesc);

    analyzeBtn.disabled = true;
    analyzeBtn.innerHTML = `
      <svg class="animate-spin h-5 w-5 inline-block mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
      </svg> Analysing...
    `;

    try {
      const response = await fetch('http://127.0.0.1:8000/parse_resume', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      renderAnalysis(data.analysis);
      analysisContainer.classList.remove('hidden');
    } catch (err) {
      alert(`Error: ${err.message}`);
      analysisContainer.innerHTML = `<p class="text-red-500">Something went wrong. Please try again.</p>`;
      analysisContainer.classList.remove('hidden');
    }

    analyzeBtn.disabled = false;
    analyzeBtn.innerHTML = `<span id="analyzeText">Analyze Resume</span>`;
  });

  function renderAnalysis(analysis) {
    document.getElementById('overall-score').textContent = analysis.overallScore || '--';
    document.getElementById('match-percent').textContent = `${analysis.overallMatch || 0}%`;
    document.getElementById('readability-score').textContent = analysis.readabilityScore || '--';
    document.getElementById('ats-score').textContent = analysis.atsCompatibilityScore || '--';
    document.getElementById('format-structure').textContent = analysis.formatAnalysis?.structure || '';
    document.getElementById('format-length').textContent = analysis.formatAnalysis?.length || '';
    document.getElementById('industry-feedback').textContent = analysis.industrySpecificFeedback || '';

    renderList('matched-keywords', analysis.keywordMatch?.matched);
    renderList('missing-keywords', analysis.keywordMatch?.missing);
    renderList('impactful-phrases', analysis.impactAnalysis?.impactfulPhrases);
    renderList('weak-phrases', analysis.impactAnalysis?.weakPhrases);
    renderList('present-skills', analysis.skillsGapAnalysis?.presentSkills);
    renderList('suggested-skills', analysis.skillsGapAnalysis?.suggestedSkills);
    renderList('improvement-suggestions', analysis.overallImprovementSuggestions);
    renderList('general-recommendations', analysis.generalRecommendations);

    renderChart(analysis);
  }

  function renderList(id, items = []) {
    const el = document.getElementById(id);
    el.innerHTML = '';
    if (!items || items.length === 0) {
      el.innerHTML = '<li>None</li>';
      return;
    }
    items.forEach(item => {
      const li = document.createElement('li');
      li.textContent = item;
      el.appendChild(li);
    });
  }

  function renderChart(analysis) {
    const ctx = document.getElementById('analysisChart').getContext('2d');

    const data = {
      labels: ['Overall Score', 'JD Match', 'Readability', 'ATS Score'],
      datasets: [{
        data: [
          analysis.overallScore || 0,
          analysis.overallMatch || 0,
          analysis.readabilityScore || 0,
          analysis.atsCompatibilityScore || 0
        ],
        backgroundColor: ['#4F46E5', '#10B981', '#F59E0B', '#EF4444'],
        hoverOffset: 8
      }]
    };

    if (chartInstance) chartInstance.destroy();

    chartInstance = new Chart(ctx, {
      type: 'doughnut',
      data,
      options: {
        cutout: '60%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              boxWidth: 10,
              font: { size: 12 }
            }
          },
          tooltip: {
            callbacks: {
              label: (context) => `${context.label}: ${context.parsed}%`
            }
          }
        }
      }
    });
  }
});
