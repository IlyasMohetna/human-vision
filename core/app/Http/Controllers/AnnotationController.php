<?php

namespace App\Http\Controllers;

use App\Models\Annotation;
use App\Models\Dataset;
use Illuminate\Http\Request;

class AnnotationController extends Controller
{
    public function annotate(Request $request, $datasetId)
    {
        $polygons = $request->polygons;

        $document = Annotation::where('dataset_id', (int) $datasetId)->first();

        $objects = $document->objects;

        $percentage = $request->percentage;
        $document->percentage = $percentage;

        $polygonMap = collect($polygons)->keyBy('objectId');
    
        foreach ($objects as &$object) {
            $objectId = $object['objectId'] ?? null;
            if ($objectId && isset($polygonMap[$objectId])) {
                $object['priority'] = $polygonMap[$objectId]['priority'];
                $object['comment'] = $polygonMap[$objectId]['comment'] ?? '';
            }
        }
    
        $document->objects = $objects;
        $document->save();
    
        return response()->json(['status' => 'success']);
    }
}
