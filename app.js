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
    
    // Update teams by owner view
    updateTeamsByOwner();
    
    // Update upcoming schedule
    updateUpcomingSchedule();
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
    
    // Sort teams alphabetically by name
    const sortedTeams = Object.entries(teamAssignments)
        .map(([teamName, assignment]) => ({
            name: teamName,
            owner: assignment.owner,
            bet: assignment.bet,
            data: nflData[teamName] || { wins: 0, losses: 0, record: '0-0' }
        }))
        .sort((a, b) => a.name.localeCompare(b.name));
    
    sortedTeams.forEach(team => {
        const teamItem = document.createElement('div');
        teamItem.className = 'team-item';
        
        const winsPerDollar = team.bet > 0 ? (team.data.wins / team.bet).toFixed(3) : '0.000';
        
        teamItem.innerHTML = `
            <div class="team-info">
                <div class="team-name">${team.name}</div>
                <div class="team-owner">Owner: ${team.owner}</div>
            </div>
            <div class="team-stats">
                <div class="team-wins">${team.data.wins} wins</div>
                <div class="team-record">Record: ${team.data.record}</div>
                <div class="team-bet">($${team.bet} bet)</div>
                <div class="team-efficiency">${winsPerDollar} wins/$</div>
            </div>
        `;
        
        teamContainer.appendChild(teamItem);
    });
}

// Update teams by owner view
function updateTeamsByOwner() {
    const container = document.getElementById('teamsByOwner');
    container.innerHTML = '';
    
    // Group teams by owner
    const ownerGroups = {};
    Object.entries(teamAssignments).forEach(([teamName, assignment]) => {
        if (!ownerGroups[assignment.owner]) {
            ownerGroups[assignment.owner] = [];
        }
        
        const teamData = nflData[teamName] || { wins: 0, losses: 0, record: '0-0' };
        ownerGroups[assignment.owner].push({
            name: teamName,
            data: teamData,
            bet: assignment.bet
        });
    });
    
    // Sort owners by total wins (descending)
    const sortedOwners = Object.entries(ownerGroups)
        .map(([owner, teams]) => ({
            owner,
            teams: teams.sort((a, b) => b.data.wins - a.data.wins),
            totalWins: teams.reduce((sum, team) => sum + team.data.wins, 0)
        }))
        .sort((a, b) => b.totalWins - a.totalWins);
    
    sortedOwners.forEach(({ owner, teams, totalWins }) => {
        const section = document.createElement('div');
        section.className = 'owner-section';
        
        section.innerHTML = `
            <h3>
                ${owner}
                <span class="owner-total-wins">${totalWins} wins</span>
            </h3>
            <div class="owner-teams" id="owner-${owner.replace(' ', '-')}"></div>
        `;
        
        const teamsContainer = section.querySelector('.owner-teams');
        
        teams.forEach(team => {
            const teamItem = document.createElement('div');
            teamItem.className = 'owner-team-item';
            
            teamItem.innerHTML = `
                <div>
                    <div class="team-name">${team.name}</div>
                    <div class="team-bet">($${team.bet} bet)</div>
                </div>
                <div class="team-stats">
                    <div class="team-wins">${team.data.wins} wins</div>
                    <div class="team-record">${team.data.record}</div>
                </div>
            `;
            
            teamsContainer.appendChild(teamItem);
        });
        
        container.appendChild(section);
    });
}

// Update upcoming schedule
async function updateUpcomingSchedule() {
    const container = document.getElementById('upcomingSchedule');
    container.innerHTML = '<div class="loading">Loading upcoming games...</div>';
    
    try {
        // Fetch upcoming games from ESPN scoreboard
        const response = await fetch('https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard');
        if (!response.ok) throw new Error('Failed to fetch schedule');
        
        const data = await response.json();
        const upcomingGames = [];
        
        if (data.events) {
            data.events.forEach(event => {
                const competition = event.competitions[0];
                const gameStatus = event.status.type.name;
                
                // Only show upcoming games (not completed or in progress)
                if (gameStatus === 'STATUS_SCHEDULED' || gameStatus === 'STATUS_POSTPONED') {
                    const homeTeam = competition.competitors.find(c => c.homeAway === 'home');
                    const awayTeam = competition.competitors.find(c => c.homeAway === 'away');
                    
                    if (homeTeam && awayTeam) {
                        const homeTeamName = normalizeTeamName(homeTeam.team.displayName);
                        const awayTeamName = normalizeTeamName(awayTeam.team.displayName);
                        
                        // Check if any of our owners have teams in this game
                        const homeOwner = teamAssignments[homeTeamName]?.owner || null;
                        const awayOwner = teamAssignments[awayTeamName]?.owner || null;
                        
                        if (homeOwner || awayOwner) {
                            upcomingGames.push({
                                date: new Date(event.date),
                                homeTeam: homeTeamName,
                                awayTeam: awayTeamName,
                                homeOwner,
                                awayOwner,
                                displayDate: event.status.type.shortDetail || 'TBD',
                                week: event.week?.number || 'TBD'
                            });
                        }
                    }
                }
            });
        }
        
        // Sort by date
        upcomingGames.sort((a, b) => a.date - b.date);
        
        container.innerHTML = '';
        
        if (upcomingGames.length === 0) {
            container.innerHTML = '<div class="schedule-item"><div>No upcoming games found for this week.</div></div>';
            return;
        }
        
        upcomingGames.forEach(game => {
            const gameItem = document.createElement('div');
            gameItem.className = 'schedule-item';
            
            const owners = [];
            if (game.awayOwner) owners.push(`${game.awayTeam.split(' ').pop()} (${game.awayOwner})`);
            if (game.homeOwner) owners.push(`${game.homeTeam.split(' ').pop()} (${game.homeOwner})`);
            
            gameItem.innerHTML = `
                <div class="schedule-game">
                    <div class="schedule-teams">
                        ${game.awayTeam} @ ${game.homeTeam}
                    </div>
                    <div class="schedule-time">${game.displayDate}</div>
                </div>
                ${owners.length > 0 ? `<div class="schedule-owners">Owners: ${owners.join(' vs ')}</div>` : ''}
            `;
            
            container.appendChild(gameItem);
        });
        
    } catch (error) {
        console.error('Error loading schedule:', error);
        container.innerHTML = '<div class="schedule-item"><div>Unable to load schedule. Please try again later.</div></div>';
    }
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
