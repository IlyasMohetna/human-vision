<?php 

namespace App\Services;

use Illuminate\Support\Facades\Http;

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
        return Http::withToken($this->token)
            ->get("{$this->apiBase}/{$this->owner}/{$this->repo}/contents/{$endpoint}");
    }

    public function listContents($path = '')
    {
        $response = $this->githubRequest($path);

        if ($response->successful()) {
            return $response->json();
        }

        return [];
    }

    public function getFileContent($path)
    {
        $response = $this->githubRequest($path);

        if ($response->successful()) {
            $content = $response->json();
            return base64_decode($content['content']);
        }

        return null;
    }

    public function traverseRepository($path = '')
    {
        $contents = $this->listContents($path);
        $allFiles = [];

        foreach ($contents as $item) {
            if ($item['type'] === 'dir') {
                dd($item);
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

    public function getCities($path = '')
    {
        $contents = $this->listContents($path);

        return array_filter($contents, function($item){
            return $item['type'] === 'dir';
        });
    }
}
