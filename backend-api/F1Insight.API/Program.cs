var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();

// Register HttpClient for OpenF1 API
builder.Services.AddHttpClient("OpenF1", client =>
{
    client.BaseAddress = new Uri("https://api.openf1.org/v1/");
    client.DefaultRequestHeaders.Add("Accept", "application/json");
});

// Allow frontend to call this API
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins("http://localhost:3000")
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

var app = builder.Build();

app.UseCors("AllowFrontend");
app.UseAuthorization();
app.MapControllers();

app.Run();