FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS base
WORKDIR /app
EXPOSE 8080

FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY ["F1Insight.API/F1Insight.API.csproj", "F1Insight.API/"]
RUN dotnet restore "F1Insight.API/F1Insight.API.csproj"
COPY . .
WORKDIR "/src/F1Insight.API"
RUN dotnet build -c Release -o /app/build

FROM build AS publish
RUN dotnet publish -c Release -o /app/publish

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "F1Insight.API.dll"]
