document.getElementById("viewBtn").addEventListener("click", async () => {
            const jwUrl = document.getElementById("jwUrl").value.trim();
            const subtitleDisplay = document.getElementById("subtitleDisplay");
            const downloadButtons = document.getElementById("downloadButtons");
            const loading = document.getElementById("loading");
            const checkboxContainer = document.getElementById("checkboxContainer");
            const includeTimingCheckbox = document.getElementById("includeTiming");

            if (!jwUrl) {
                alert("Please enter a valid JW.org URL.");
                return;
            }

            // Extract the last part of the URL (after the last slash)
            const lastPart = jwUrl.split("/").pop();
            if (!lastPart) {
                alert("Invalid JW.org URL format.");
                return;
            }

            // Construct the API URL for fetching subtitles
            const apiUrl = `https://b.jw-cdn.org/apis/mediator/v1/media-items/E/${lastPart}?clientType=www`;

            try {
                loading.style.display = 'block'; // Show loading animation
                subtitleDisplay.hidden = true; // Hide subtitles
                downloadButtons.hidden = true; // Hide download buttons
                checkboxContainer.hidden = true; // Hide checkbox

                // Fetch the JSON data from the constructed URL
                const response = await fetch(apiUrl);
                if (!response.ok) {
                    throw new Error(`Failed to fetch data: ${response.statusText}`);
                }

                const data = await response.json();

                // Extract the subtitles URL
                const subtitlesUrl = data.media?.[0]?.files
                    ?.find(file => file.subtitles)?.subtitles.url;

                if (!subtitlesUrl) {
                    alert("Subtitles URL not found in the JSON data.");
                    return;
                }

                // Fetch the subtitles content
                const subtitleResponse = await fetch(subtitlesUrl);
                if (!subtitleResponse.ok) {
                    throw new Error(`Failed to fetch subtitles: ${subtitleResponse.statusText}`);
                }

                const subtitlesText = await subtitleResponse.text();

                // Show the subtitles content
                const renderSubtitles = () => {
                    if (includeTimingCheckbox.checked) {
                        subtitleDisplay.textContent = subtitlesText;
                    } else {
                        const noTimingText = subtitlesText
                            .split("\n")
                            .filter(line => !line.match(/^\d{2}:\d{2}:\d{2}\.\d{3} --> \d{2}:\d{2}:\d{2}\.\d{3}/) && line.trim())
                            .join(" ");
                        subtitleDisplay.textContent = noTimingText;
                    }
                };

                renderSubtitles(); // Initial render
                subtitleDisplay.hidden = false;

                // Attach event listener to re-render on checkbox toggle
                includeTimingCheckbox.addEventListener("change", renderSubtitles);

                // Prepare the download buttons
                document.getElementById("downloadVttBtn").onclick = () => downloadSubtitles(subtitlesText, "vtt");
                document.getElementById("downloadTxtBtn").onclick = () => downloadSubtitles(subtitlesText, "txt");

                // Prepare the "Copy Text" button
                document.getElementById("copyTextBtn").onclick = () => copyText(subtitlesText);

                downloadButtons.hidden = false;
                checkboxContainer.hidden = false;
                loading.style.display = 'none'; // Hide loading animation
            } catch (error) {
                console.error("Error:", error);
                alert(`An error occurred: ${error.message}`);
                loading.style.display = 'none'; // Hide loading animation
            }
        });

        function downloadSubtitles(subtitlesText, type) {
            const blobContent = type === "vtt" ? subtitlesText : subtitlesText
                .split("\n")
                .filter(line => !line.match(/^\d{2}:\d{2}:\d{2}\.\d{3} --> \d{2}:\d{2}:\d{2}\.\d{3}/) && line.trim())
                .join(" ");

            const blob = new Blob([blobContent], { type: type === "vtt" ? "text/vtt" : "text/plain" });
            const a = document.createElement("a");
            a.href = URL.createObjectURL(blob);
            a.download = type === "vtt" ? "subtitles.vtt" : "subtitles.txt";
            a.click();
        }

        function copyText(subtitlesText) {
            const textToCopy = document.getElementById("includeTiming").checked
                ? subtitlesText
                : subtitlesText
                    .split("\n")
                    .filter(line => !line.match(/^\d{2}:\d{2}:\d{2}\.\d{3} --> \d{2}:\d{2}:\d{2}\.\d{3}/) && line.trim())
                    .join(" ");
            navigator.clipboard.writeText(textToCopy).then(() => {
                alert("Subtitles copied to clipboard!");
            }, (err) => {
                console.error("Failed to copy text:", err);
                alert("Failed to copy text.");
            });
        }