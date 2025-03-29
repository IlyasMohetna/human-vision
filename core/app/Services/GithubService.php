<?php 

namespace App\Services;

use Illuminate\Support\Facades\Http;

use function PHPUnit\Framework\isNumeric;

class GithubService
{
    protected $token;
    protected $owner;
    protected $repo;
    protected $apiBase = 'https://api.github.com/repos';

    public function __construct()
    {
        $this->token = config('github.token');
        $this->owner = config('github.owner');
        $this->repo = config('github.repo');
    }

    protected function githubRequest($endpoint)
    {
        $url = "{$this->apiBase}/{$this->owner}/{$this->repo}/{$endpoint}";

        $response = Http::withToken($this->token)->get($url);

        $remaining = $response->header('X-RateLimit-Remaining');
        $limit = $response->header('X-RateLimit-Limit');

        if(isNumeric($remaining) && isNumeric($limit)) {
            $remaining = (int)$remaining;
            $used = (int)$limit - (int)$remaining;
            $limit = (int)$limit;
            logger()->info("[GitHub API] {$used}/{$limit} used – {$remaining} remaining for endpoint: {$endpoint}");
        }
    
        return $response;
    }

    public function listContents($path = '')
    {
        $response = $this->githubRequest($path);

        if ($response->successful()) {
            return $response->json();
        }

        return [];
    }

    public function downloadRepoArchive(string $ref = 'main'): ?string
    {
        $filename = storage_path("app/{$this->repo}-{$ref}.zip");

        // GitHub API endpoint to download a repository archive (ZIP)
        $url = "https://api.github.com/repos/{$this->owner}/{$this->repo}/zipball/{$ref}";

        try {
            $response = Http::withOptions([
                    'allow_redirects' => true,   // Follow the 302 redirect automatically
                    'sink'            => $filename, // Stream directly to file
                    'timeout'         => 300,     // Increase timeout as needed
                ])
                ->withHeaders([
                    'Accept'                 => 'application/vnd.github+json',
                    'Authorization'          => "Bearer {$this->token}",
                    'X-GitHub-Api-Version'   => '2022-11-28',
                ])
                ->get($url);

            if ($response->successful()) {
                return $filename;
            }

            logger()->error("Failed to download repository archive. HTTP Status: {$response->status()}");
            return null;
        } catch (\Exception $e) {
            logger()->error("Exception while downloading repository archive: " . $e->getMessage());
            return null;
        }
    }

    public function getFileContent($path)
    {
        $response = $this->githubRequest($path);

        if (!$response->successful()) {
            logger()->error("Failed to fetch file metadata for: $path");
            return null;
        }

        $data = $response->json();

        if (isset($data['content'])) {
            return base64_decode($data['content']);
        }

        if (isset($data['download_url'])) {
            $downloadResponse = Http::withToken($this->token)->get($data['download_url']);
            if ($downloadResponse->successful()) {
                return $downloadResponse->body();
            } else {
                logger()->error("Failed to download large file: $path");
            }
        }

        logger()->warning("No content or download_url found for: $path");
        return null;
    }

    public function downloadFile(array $fileInfo): ?string
    {
        if (!isset($fileInfo['download_url'])) {
            logger()->error("Missing download_url for file: " . ($fileInfo['path'] ?? 'unknown'));
            return null;
        }

        $response = Http::withToken($this->token)->get($fileInfo['download_url']);

        if ($response->successful()) {
            return $response->body();
        } else {
            logger()->error("Failed to download file from URL: {$fileInfo['download_url']}");
            return null;
        }
    }

    public function traverseRepository($path = '')
    {
        $contents = $this->listContents($path);
        $allFiles = [];

        foreach ($contents as $item) {
            if ($item['type'] === 'dir') {
                $allFiles = array_merge($allFiles, $this->traverseRepository($item['path']));
            } elseif ($item['type'] === 'file') {
                $allFiles[] = [
                    'path' => $item['path'],
                    'content' => $this->getFileContent($item['path']),
                ];
            }
        }

        return $allFiles;
    }

    public function getDatasetStructure()
    {
        $structure = [];

        $cities = $this->getCities();

        foreach ($cities as $city) {
            $cityName = $city['name'];
            $cityPath = $city['path'];

            $citySubfolders = $this->listContents($cityPath);

            $datasetFolders = array_filter($citySubfolders, function ($item) {
                return $item['type'] === 'dir';
            });

            $structure[$cityName] = array_map(function ($folder) {
                return $folder['path'];
            }, $datasetFolders);
        }

        return $structure;
    }

    public function getCities($path = '')
    {
        $contents = $this->listContents($path);

        return array_filter($contents, function ($item) {
            return $item['type'] === 'dir';
        });
    }
} 
