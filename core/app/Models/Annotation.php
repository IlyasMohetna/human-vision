<?php

namespace App\Models;

use MongoDB\Laravel\Eloquent\Model;

class Annotation extends Model
{
    protected $connection = 'mongodb';
    protected $collection = 'annotations';

    public function dataset()
    {
        return $this->belongsTo(Dataset::class, 'dataset_id', '_id');
    }
}
