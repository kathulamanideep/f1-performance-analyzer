using Microsoft.AspNetCore.Mvc;

namespace F1Insight.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class F1Controller : ControllerBase
{
    private readonly HttpClient _http;

    public F1Controller(IHttpClientFactory httpClientFactory)
    {
        _http = httpClientFactory.CreateClient("OpenF1");
    }

    // GET /api/f1/sessions?year=2026
    [HttpGet("sessions")]
    public async Task<IActionResult> GetSessions([FromQuery] int year = 2026)
    {
        var response = await _http.GetAsync($"sessions?year={year}");
        var content = await response.Content.ReadAsStringAsync();
        return Content(content, "application/json");
    }

    // GET /api/f1/laps?session_key=11234&driver_number=3
    [HttpGet("laps")]
    public async Task<IActionResult> GetLaps([FromQuery] int session_key, [FromQuery] int driver_number)
    {
        var response = await _http.GetAsync($"laps?session_key={session_key}&driver_number={driver_number}");
        var content = await response.Content.ReadAsStringAsync();
        return Content(content, "application/json");
    }

    // GET /api/f1/stints?session_key=11234&driver_number=3
    [HttpGet("stints")]
    public async Task<IActionResult> GetStints([FromQuery] int session_key, [FromQuery] int driver_number)
    {
        var response = await _http.GetAsync($"stints?session_key={session_key}&driver_number={driver_number}");
        var content = await response.Content.ReadAsStringAsync();
        return Content(content, "application/json");
    }

    // GET /api/f1/pit?session_key=11234&driver_number=3
    [HttpGet("pit")]
    public async Task<IActionResult> GetPit([FromQuery] int session_key, [FromQuery] int driver_number)
    {
        var response = await _http.GetAsync($"pit?session_key={session_key}&driver_number={driver_number}");
        var content = await response.Content.ReadAsStringAsync();
        return Content(content, "application/json");
    }

    // GET /api/f1/drivers?session_key=11234
    [HttpGet("drivers")]
    public async Task<IActionResult> GetDrivers([FromQuery] int session_key)
    {
        var response = await _http.GetAsync($"drivers?session_key={session_key}");
        var content = await response.Content.ReadAsStringAsync();
        return Content(content, "application/json");
    }

    // GET /api/f1/compare?session_key=11234&driver1=3&driver2=16
    [HttpGet("compare")]
    public async Task<IActionResult> CompareLaps(
        [FromQuery] int session_key,
        [FromQuery] int driver1,
        [FromQuery] int driver2)
    {
        var task1 = _http.GetAsync($"laps?session_key={session_key}&driver_number={driver1}");
        var task2 = _http.GetAsync($"laps?session_key={session_key}&driver_number={driver2}");
        await Task.WhenAll(task1, task2);

        var laps1 = await task1.Result.Content.ReadAsStringAsync();
        var laps2 = await task2.Result.Content.ReadAsStringAsync();

        var result = new
        {
            driver1 = new { driver_number = driver1, laps = System.Text.Json.JsonSerializer.Deserialize<object>(laps1) },
            driver2 = new { driver_number = driver2, laps = System.Text.Json.JsonSerializer.Deserialize<object>(laps2) }
        };

        return Ok(result);
    }
}