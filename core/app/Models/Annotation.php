<?php

namespace App\Models;

use MongoDB\Laravel\Eloquent\Model;

class Annotation extends Model
{
    protected $connection = 'mongodb';
    protected $collection = 'annotations';
}
