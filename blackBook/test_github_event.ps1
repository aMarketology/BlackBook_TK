# Test GitHub Universe Event on BlackBook Blockchain
# This posts the GitHub Universe event with 0.7 confidence

$event = @{
    source = @{
        domain = "www.objectwire.org"
        url = "https://www.objectwire.org/github-universe-october-28th-and-29th-san-fransico"
    }
    event = @{
        title = "Will GitHub Universe 2025 exceed 4,000 attendees?"
        description = "GitHub Universe 2025 is happening October 28-29 in San Francisco. Historically, the event has drawn around 3,700 attendees. Will this year exceed 4,000?"
        category = "tech"
        options = @(
            "Yes, over 4,000 attendees"
            "No, under 4,000 attendees"
            "Exactly 3,700 attendees"
        )
        confidence = 0.7
        source_url = "https://www.objectwire.org/github-universe-october-28th-and-29th-san-fransico"
    }
} | ConvertTo-Json -Depth 10

Write-Host "🚀 Posting GitHub Universe event to BlackBook blockchain..." -ForegroundColor Cyan
Write-Host ""
Write-Host "Event Details:" -ForegroundColor Yellow
Write-Host "  Title: Will GitHub Universe 2025 exceed 4,000 attendees?" -ForegroundColor White
Write-Host "  Confidence: 0.7 (above 0.555 threshold)" -ForegroundColor Green
Write-Host "  Result: Will be added to RSS feed AND created as prediction market" -ForegroundColor Green
Write-Host ""

try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/ai/events" `
        -Method Post `
        -ContentType "application/json" `
        -Body $event
    
    Write-Host "✅ SUCCESS!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Response:" -ForegroundColor Yellow
    $response | ConvertTo-Json -Depth 10 | Write-Host
    
    if ($response.added_to_ledger) {
        Write-Host ""
        Write-Host "🎯 Prediction Market Created!" -ForegroundColor Magenta
        Write-Host "   Market ID: $($response.market_id)" -ForegroundColor White
        Write-Host "   View at: http://localhost:3000/markets/$($response.market_id)" -ForegroundColor Cyan
    }
    
    Write-Host ""
    Write-Host "📡 RSS Feed Updated!" -ForegroundColor Magenta
    Write-Host "   View at: http://localhost:3000/ai/events/feed.rss" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "📋 View all recent AI events:" -ForegroundColor Cyan
    Write-Host "   http://localhost:3000/ai/events/recent" -ForegroundColor White
    
} catch {
    Write-Host "❌ ERROR: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Make sure the BlackBook backend is running:" -ForegroundColor Yellow
    Write-Host "  cd blackBook" -ForegroundColor White
    Write-Host "  cargo run" -ForegroundColor White
}
