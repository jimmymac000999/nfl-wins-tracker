// Global variables
let nflData = {};
let lastUpdated = null;
let autoRefreshInterval = null;

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    setupAutoRefresh();
    loadNFLData();
});

// Setup auto-refresh functionality
function setupAutoRefresh() {
    const autoRefreshCheckbox = document.getElementById('autoRefresh');
    
    if (autoRefreshCheckbox.checked) {
        startAutoRefresh();
    }
    
    autoRefreshCheckbox.addEventListener('change', function() {
        if (this.checked) {
            startAutoRefresh();
        } else {
            stopAutoRefresh();
        }
    });
}

function startAutoRefresh() {
    // Refresh every 5 minutes (300000 ms)
    autoRefreshInterval = setInterval(loadNFLData, 300000);
}

function stopAutoRefresh() {
    if (autoRefreshInterval) {
        clearInterval(autoRefreshInterval);
        autoRefreshInterval = null;
    }
}

// Manual refresh function
function refreshData() {
    const refreshBtn = document.getElementById('refreshBtn');
    refreshBtn.disabled = true;
    refreshBtn.textContent = '🔄 Refreshing...';
    
    loadNFLData().finally(() => {
        refreshBtn.disabled = false;
        refreshBtn.textContent = '🔄 Refresh Now';
    });
}

// Load NFL data from ESPN API
async function loadNFLData() {
    showLoading();
    hideError();
    
    try {
        console.log('Fetching NFL team data...');
        const teams = {};
        
        // Fetch data for each team using individual team APIs
        const teamPromises = Object.entries(teamAbbreviations).map(async ([fullName, abbrev]) => {
            try {
                const response = await fetch(`https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams/${abbrev.toLowerCase()}`);
                if (response.ok) {
                    const teamData = await response.json();
                    const record = teamData.team?.record?.items?.[0];
                    
                    if (record) {
                        const wins = record.stats?.find(stat => stat.name === 'wins')?.value || 0;
                        const losses = record.stats?.find(stat => stat.name === 'losses')?.value || 0;
                        
                        teams[fullName] = {
                            wins: parseInt(wins),
                            losses: parseInt(losses),
                            record: record.summary || `${parseInt(wins)}-${parseInt(losses)}`
                        };
                        
                        console.log(`${fullName}: ${teams[fullName].record}`);
                    }
                }
            } catch (error) {
                console.log(`Failed to fetch data for ${fullName}:`, error.message);
            }
        });
        
        // Wait for all team data to be fetched
        await Promise.allSettled(teamPromises);
        
        // If we got data for most teams, use it
        if (Object.keys(teams).length > 20) {
            nflData = teams;
            lastUpdated = new Date();
            updateDisplay();
        } else {
            throw new Error(`Only got data for ${Object.keys(teams).length} teams`);
        }
        
    } catch (error) {
        console.error('Error loading NFL data:', error);
        
        // Fallback: use mock data for demonstration
        console.log('Using fallback mock data...');
        useMockData();
    }
}


// Fallback mock data for development/testing
function useMockData() {
    // Mock data with random wins (0-10) for demonstration
    const mockData = {};
    
    Object.keys(teamAssignments).forEach(teamName => {
        mockData[teamName] = {
            wins: Math.floor(Math.random() * 11), // Random wins 0-10
            losses: Math.floor(Math.random() * 6), // Random losses 0-5
            record: `${Math.floor(Math.random() * 11)}-${Math.floor(Math.random() * 6)}`
        };
    });
    
    nflData = mockData;
    lastUpdated = new Date();
    
    updateDisplay();
}

// Normalize team names to match our data structure
function normalizeTeamName(apiTeamName) {
    // Direct match
    if (teamAssignments[apiTeamName]) {
        return apiTeamName;
    }
    
    // Check mappings
    if (teamNameMappings[apiTeamName]) {
        return teamNameMappings[apiTeamName];
    }
    
    // Try to find partial matches
    for (const fullName of Object.keys(teamAssignments)) {
        if (fullName.toLowerCase().includes(apiTeamName.toLowerCase()) ||
            apiTeamName.toLowerCase().includes(fullName.split(' ').pop().toLowerCase())) {
            return fullName;
        }
    }
    
    return apiTeamName;
}

// Calculate person summaries
function calculatePersonSummaries() {
    const people = {};
    
    // Initialize people
    Object.values(teamAssignments).forEach(team => {
        if (!people[team.owner]) {
            people[team.owner] = {
                totalWins: 0,
                totalBets: 0,
                teams: [],
                teamCount: 0
            };
        }
    });
    
    // Calculate totals
    Object.entries(teamAssignments).forEach(([teamName, assignment]) => {
        const teamData = nflData[teamName] || { wins: 0, losses: 0, record: '0-0' };
        
        people[assignment.owner].totalWins += teamData.wins;
        people[assignment.owner].totalBets += assignment.bet;
        people[assignment.owner].teams.push({
            name: teamName,
            wins: teamData.wins,
            losses: teamData.losses,
            record: teamData.record,
            bet: assignment.bet
        });
        people[assignment.owner].teamCount += 1;
    });
    
    // Sort teams by wins (descending)
    Object.values(people).forEach(person => {
        person.teams.sort((a, b) => b.wins - a.wins);
    });
    
    return people;
}

// Update the display
function updateDisplay() {
    hideLoading();
    showMainContent();
    updateLastUpdatedDisplay();
    
    const people = calculatePersonSummaries();
    
    // Update summary cards
    updateSummaryCards(people);
    
    // Update detailed team view
    updateTeamDetails();
}

// Update summary cards for each person
function updateSummaryCards(people) {
    const summaryContainer = document.getElementById('summaryCards');
    summaryContainer.innerHTML = '';
    
    // Sort people by total wins (descending)
    const sortedPeople = Object.entries(people).sort((a, b) => b[1].totalWins - a[1].totalWins);
    
    sortedPeople.forEach(([name, data]) => {
        const card = document.createElement('div');
        card.className = 'person-card';
        
        const avgWins = (data.totalWins / data.teamCount).toFixed(1);
        const topTeams = data.teams.slice(0, 3).map(team => `${team.name.split(' ').pop()} (${team.wins})`).join(', ');
        
        card.innerHTML = `
            <div class="person-name">${name}</div>
            <div class="person-stats">
                <div class="stat main-stat">
                    <div class="stat-value total-wins">${data.totalWins}</div>
                    <div class="stat-label">Total Wins</div>
                </div>
                <div class="stat">
                    <div class="stat-value">${data.teamCount}</div>
                    <div class="stat-label">Teams</div>
                </div>
                <div class="stat">
                    <div class="stat-value">${avgWins}</div>
                    <div class="stat-label">Avg Wins/Team</div>
                </div>
            </div>
            <div class="team-list">
                <strong>Best Teams:</strong> ${topTeams}
            </div>
            <div class="bet-note">
                Total bet amount: $${data.totalBets}
            </div>
        `;
        
        summaryContainer.appendChild(card);
    });
}

// Update detailed team view
function updateTeamDetails() {
    const teamContainer = document.getElementById('teamDetails');
    teamContainer.innerHTML = '';
    
    // Sort teams by wins (descending)
    const sortedTeams = Object.entries(teamAssignments)
        .map(([teamName, assignment]) => ({
            name: teamName,
            owner: assignment.owner,
            bet: assignment.bet,
            data: nflData[teamName] || { wins: 0, losses: 0, record: '0-0' }
        }))
        .sort((a, b) => b.data.wins - a.data.wins);
    
    sortedTeams.forEach(team => {
        const teamItem = document.createElement('div');
        teamItem.className = 'team-item';
        
        teamItem.innerHTML = `
            <div class="team-info">
                <div class="team-name">${team.name}</div>
                <div class="team-owner">Owner: ${team.owner}</div>
            </div>
            <div class="team-stats">
                <div class="team-wins">${team.data.wins} wins</div>
                <div class="team-record">Record: ${team.data.record}</div>
                <div class="team-bet">($${team.bet} bet)</div>
            </div>
        `;
        
        teamContainer.appendChild(teamItem);
    });
}

// UI helper functions
function showLoading() {
    document.getElementById('loadingIndicator').style.display = 'block';
    document.getElementById('mainContent').style.display = 'none';
}

function hideLoading() {
    document.getElementById('loadingIndicator').style.display = 'none';
}

function showMainContent() {
    document.getElementById('mainContent').style.display = 'block';
}

function showError(message) {
    const errorElement = document.getElementById('errorMessage');
    errorElement.textContent = message;
    errorElement.style.display = 'block';
}

function hideError() {
    document.getElementById('errorMessage').style.display = 'none';
}

function updateLastUpdatedDisplay() {
    const lastUpdatedElement = document.getElementById('lastUpdated');
    if (lastUpdated) {
        lastUpdatedElement.textContent = `Last updated: ${lastUpdated.toLocaleString()}`;
        lastUpdatedElement.style.display = 'block';
    } else {
        lastUpdatedElement.style.display = 'none';
    }
}
