<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DatasetResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'city' => $this->city->name,
            'variants' => $this->variants->map(function ($variant) {
                return [
                    'type' => $variant->type->name,
                    'path' => asset('storage/' . $variant->path),
                ];
            }),
            'meta' => $this->annotation->meta,
            'objects' => $this->annotation->objects,
            'vehicle' => $this->annotation->vehicle,
        ];
    }
}
