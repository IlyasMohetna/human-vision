<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Dataset extends Model
{
    protected $table = 'datasets';

    public function variants()
    {
        return $this->hasMany(Variant::class, 'dataset_id');
    }

    public function annotation()
    {
        return $this->hasOne(Annotation::class, 'dataset_id');
    }

    public function city()
    {
        return $this->belongsTo(City::class, 'city_id');
    }

    public function status()
    {
        return $this->belongsTo(Status::class, 'status_id');
    }
}
