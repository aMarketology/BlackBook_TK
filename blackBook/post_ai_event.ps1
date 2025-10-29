# Test script to POST AI events to BlackBook blockchain
# This simulates an AI agent posting prediction market events

Write-Host "🤖 BlackBook AI Event Poster" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Example event with HIGH confidence (will be added to ledger)
$highConfidenceEvent = @{
    source = @{
        domain = "www.objectwire.org"
        url = "https://www.objectwire.org/does-doordash-take-snap"
    }
    event = @{
        title = "Will SNAP benefits mentioned in the article be exhausted by November 1, 2025?"
        description = "Based on the article titled 'Objectively, how much does DoorDash make from SNAP ?', will SNAP benefits run out by Nov 1, 2025?"
        category = "business"
        options = @(
            "Yes, benefits exhausted by Nov 1, 2025",
            "No, benefits remain on Nov 1, 2025"
        )
        confidence = 0.75  # Above 0.555 threshold - will create market
        source_url = "https://www.objectwire.org/does-doordash-take-snap"
    }
}

# Example event with LOW confidence (RSS only)
$lowConfidenceEvent = @{
    source = @{
        domain = "techcrunch.com"
        url = "https://techcrunch.com/sample-article"
    }
    event = @{
        title = "Will Apple announce new product category in Q4 2025?"
        description = "Based on rumors and leaks, will Apple announce a completely new product category before the end of 2025?"
        category = "tech"
        options = @(
            "Yes, new category announced",
            "No, no new category"
        )
        confidence = 0.45  # Below 0.555 threshold - RSS only
        source_url = "https://techcrunch.com/sample-article"
    }
}

Write-Host "📤 Posting HIGH confidence event (0.75 > 0.555)..." -ForegroundColor Green
$highJson = $highConfidenceEvent | ConvertTo-Json -Depth 5
$highResponse = Invoke-RestMethod -Uri "http://localhost:3000/ai/events" -Method Post -Body $highJson -ContentType "application/json"
Write-Host "✅ Response:" -ForegroundColor Green
$highResponse | ConvertTo-Json -Depth 5 | Write-Host
Write-Host ""

Start-Sleep -Seconds 1

Write-Host "📤 Posting LOW confidence event (0.45 < 0.555)..." -ForegroundColor Yellow
$lowJson = $lowConfidenceEvent | ConvertTo-Json -Depth 5
$lowResponse = Invoke-RestMethod -Uri "http://localhost:3000/ai/events" -Method Post -Body $lowJson -ContentType "application/json"
Write-Host "✅ Response:" -ForegroundColor Yellow
$lowResponse | ConvertTo-Json -Depth 5 | Write-Host
Write-Host ""

Write-Host "📋 Checking recent AI events..." -ForegroundColor Cyan
$recentEvents = Invoke-RestMethod -Uri "http://localhost:3000/ai/events/recent" -Method Get
Write-Host "Total events: $($recentEvents.count)" -ForegroundColor Cyan
Write-Host ""

Write-Host "📡 RSS Feed available at: http://localhost:3000/ai/events/feed.rss" -ForegroundColor Magenta
Write-Host ""

# You can also use curl:
Write-Host "💡 Or use curl:" -ForegroundColor Gray
Write-Host 'curl -X POST http://localhost:3000/ai/events -H "Content-Type: application/json" -d @test_ai_event.json' -ForegroundColor Gray
